# Auditoría + Propuesta de Mejora — NubeKids Tales

> **Fecha:** 2026-07-10
> **Alcance:** salud del repo, seguridad, sistema de prompts, rediseño del Paso 2 "El Viaje Interior",
> persistencia del cuento en móvil y mejoras de negocio.
> **Estado:** propuesta para validación — no se ha cambiado código de producto todavía.

---

## 1. Resumen ejecutivo

| Área | Estado | Acción |
|------|--------|--------|
| Build / TypeScript / Tests | ✅ Verde (build ok, tsc ok, 5/5 tests) | Ampliar cobertura |
| Lint | ⚠️ 2 errores en `Book.tsx` | Arreglar (30 min) |
| Seguridad Supabase | 🔴 **4 hallazgos críticos verificados en producción** | **Arreglar HOY** (SQL en §2) |
| Secretos en git | 🔴 API keys reales en el historial | Rotar claves HOY |
| Dependencias | ⚠️ 16 vulnerabilidades (1 crítica, 7 high) | `npm audit fix` + subir `@vercel/node` |
| Sistema de prompts | ✅ Funciona, buen diseño | Mejoras de jerarquía y mapeo (§4) |
| Form Paso 2 | ⚠️ Dilución pedagógica (el problema que detectaste) | Rediseño "Ancla + Foco" (§5) |
| Persistencia móvil | 🔴 El cuento vive solo en memoria RAM del navegador | Plan en 2 fases (§6) |
| Negocio | ⚠️ Crédito se pierde si falla la generación; sin retención | Propuestas (§7) |

---

## 2. Seguridad — hallazgos priorizados

Verificado contra el proyecto Supabase real (`NubeKids_Tails`) con el linter oficial de Supabase
y consulta directa de `pg_policies`. **Los 4 críticos son explotables hoy por cualquiera que abra
la web**, porque la `anon key` de Supabase va en el bundle JS (eso es normal; lo que no es normal
es lo que permite hacer).

### 🔴 CRÍTICO 1 — `add_credits` ejecutable por `anon`: créditos infinitos gratis

La función `add_credits` es `SECURITY DEFINER` y cualquier visitante puede llamarla vía
`POST /rest/v1/rpc/add_credits` con la anon key pública. Resultado: **cualquiera puede regalarse
créditos ilimitados a sí mismo o a cualquier tenant**, sin pasar por Stripe.
Solo debe poder llamarla el webhook de Stripe (que ya usa `service_role`).

### 🔴 CRÍTICO 2 — `consume_credit` acepta IDs arbitrarios: drenar saldos ajenos

`consume_credit(p_tenant_id, p_user_id)` no valida `auth.uid()`. Cualquiera puede vaciar el saldo
de cualquier usuario o tenant en un bucle (griefing directo a tus clientes de pago).

### 🔴 CRÍTICO 3 — Tabla `tokens` con `SELECT USING (true)`: volcado de tokens y emails

Política actual: `"Allow token validation" SELECT roles={public} qual=true`. Cualquiera puede hacer
`GET /rest/v1/tokens?select=*` y llevarse **todos los tokens one-time sin usar** (cuentos gratis a
costa de los tenants) **y todos los `customer_email`** (fuga de PII → incidente RGPD).
`tenants` también es de lectura pública total: expone `integration_secret_hash` (hash sin salt del
secreto de integración → fuerza bruta offline) y los `baseSystemPrompt`.

### 🔴 CRÍTICO 4 — `VITE_GEMINI_API_KEY` en el bundle del cliente

Toda la generación (agentes + imágenes) corre en el navegador con tu API key de Gemini incrustada
en el JS. Cualquiera la extrae en 1 minuto y genera a tu costa — y de paso **se salta el sistema de
créditos entero**, que solo se comprueba en el cliente. Tu propia regla en
`.claude/rules/serverless-api.md` ya lo dice: "No exponer API keys de Gemini en el frontend en
producción". Es el motivo estructural para mover la generación a un endpoint serverless (§7.2).
Mitigación inmediata mientras tanto: cap de gasto bajo en Google AI Studio + rotación + no hacer
campañas de tráfico hasta migrar.

### SQL de remediación (críticos 1-3) — listo para aplicar

```sql
-- 1) Nadie desde el navegador puede añadir créditos
REVOKE EXECUTE ON FUNCTION public.add_credits(text, uuid, integer, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_tenant_tokens(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- 2) consume_credit: solo el propio usuario autenticado puede consumir su saldo.
--    (El consumo de tenant B2B ya va por consume_b2b_token, que exige poseer el token.)
CREATE OR REPLACE FUNCTION public.consume_credit(
  p_tenant_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_story_session_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_account_id UUID;
  v_balance INTEGER;
BEGIN
  -- Un usuario solo puede consumir SU crédito
  IF p_user_id IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN FALSE;
  END IF;
  -- El consumo por tenant desde el cliente queda deshabilitado (usar consume_b2b_token)
  IF p_tenant_id IS NOT NULL AND auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  -- ... (resto del cuerpo actual sin cambios)
  IF p_tenant_id IS NOT NULL THEN
    SELECT id, balance INTO v_account_id, v_balance
    FROM public.credit_accounts WHERE tenant_id = p_tenant_id FOR UPDATE;
  ELSE
    SELECT id, balance INTO v_account_id, v_balance
    FROM public.credit_accounts WHERE user_id = p_user_id FOR UPDATE;
  END IF;
  IF v_account_id IS NULL OR v_balance < 1 THEN RETURN FALSE; END IF;
  UPDATE public.credit_accounts
     SET balance = balance - 1, total_consumed = total_consumed + 1, updated_at = NOW()
   WHERE id = v_account_id;
  INSERT INTO public.credit_transactions
    (credit_account_id, type, amount, balance_after, story_session_id, description)
  VALUES (v_account_id, 'consumption', -1, v_balance - 1, p_story_session_id, 'Story generation');
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3) tokens: quitar lectura pública; validar vía RPC que exige conocer el token exacto
DROP POLICY "Allow token validation" ON public.tokens;

CREATE OR REPLACE FUNCTION public.validate_b2b_token(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row record;
BEGIN
  SELECT t.id, t.token, t.tenant_id, t.brand_name, t.item_image_url, t.item_name,
         t.customer_email, t.is_used, t.expires_at
    INTO v_row FROM public.tokens t WHERE t.token = p_token;
  IF v_row IS NULL THEN RETURN jsonb_build_object('valid', false, 'code', 'not_found'); END IF;
  IF v_row.is_used THEN RETURN jsonb_build_object('valid', false, 'code', 'already_used'); END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'code', 'expired');
  END IF;
  RETURN jsonb_build_object('valid', true, 'token', to_jsonb(v_row));
END; $$;

-- 4) tenants: sustituir lectura total por una vista pública sin columnas sensibles
DROP POLICY "Allow tenant read" ON public.tenants;
CREATE VIEW public.tenants_public
  WITH (security_invoker = off) AS
  SELECT id, tenant_id, name, brand_name, integration_level, vertical_id,
         item_interaction_mode, item_label, brand_colors, pedagogy_enabled
    FROM public.tenants;
GRANT SELECT ON public.tenants_public TO anon, authenticated;
-- (tokenService.ts pasa a leer tenants_public y a usar rpc('validate_b2b_token'))
```

> Nota: el frontend (`tokenService.validateToken`) necesita un cambio pequeño para usar la RPC en
> lugar del `select` directo. Puedo hacerlo junto con la migración.

### 🔴 ALTO — Secretos reales en el historial de git

`docs/reference/.env-old` se commiteó en `3bfd39f` con una **GEMINI_API_KEY y una PINECONE_API_KEY
reales** (se borró después en `0a7c66a`, pero el historial las conserva — cualquiera con acceso al
repo las recupera con `git show`). Acción: **rotar ambas claves ya** y, si el repo puede hacerse
público algún día, purgar el historial (`git filter-repo`).

### ⚠️ MEDIOS

| Hallazgo | Detalle | Fix |
|---|---|---|
| Prompt del tenant sin sanitizar y mal ordenado | `narrativeAgent.ts:88` hace `SYSTEM_PROMPT + baseSystemPrompt` — el prompt del tenant va DESPUÉS de las reglas, o sea puede "re-instruir" al modelo. Tu propia regla dice: guardrails SIEMPRE al final | Reordenar + bloque "GUARDRAILS INVIOLABLES" al cierre + sanitizado básico |
| Dependencias vulnerables | 16 vulns (1 crítica): `undici` (vía `@vercel/node`), `ws`, etc. | `npm audit fix`; evaluar `@vercel/node` major |
| Leaked password protection OFF | Supabase Auth no comprueba contraseñas filtradas | Activar en dashboard (1 clic) |
| `search_path` mutable en 7 funciones | Riesgo de hijacking clásico de SECURITY DEFINER | `SET search_path = public` en cada una |
| Extensión `vector` en schema `public` | Recomendación Supabase | Mover a schema `extensions` |
| Sin rate limiting | `/api/b2b/activation-request` y `/api/stripe/create-checkout` | Vercel WAF / upstash ratelimit |
| `credit_accounts` de tenant legibles por cualquiera | `qual: tenant_id IS NOT NULL` para `public` | Restringir a owner del tenant |

---

## 3. Salud del código

**Lo bueno:** arquitectura limpia y fiel a CLAUDE.md (pipeline secuencial, tenants, guardrails por
edad), TypeScript estricto sin errores, build verde, code-splitting bien hecho (jsPDF y agentes en
chunks lazy), tests de sanitizadores pasando.

**A corregir:**

1. **Lint roto**: 2 errores `react-hooks/set-state-in-effect` en `Book.tsx:180` y `Book.tsx:194`.
2. **`npm run test` no existe** (CLAUDE.md lo referencia como gate estándar); solo hay `test:unit`.
   Añadir alias y, a futuro, Vitest como dice la convención.
3. **Cobertura mínima**: 1 solo archivo de tests (sanitizadores). Faltan tests de `ragService`
   (adaptive chunks), `tokenService`, y del mapeo pedagogía→prompt.
4. **Monolitos**: `App.tsx` (1.097 líneas) y `Book.tsx` (1.079). Extraer `useStoryGeneration`,
   `useAppBootstrap` (todo el bloque de inicialización token/B2B/B2C) y componentes de pantalla.
5. **5 `<select>` nativos en `StepHero.tsx`** (rasgos del protagonista) — anti-pattern explícito
   del design system ("No usar `<select>` nativo").
6. **Residuos**: `temp-app-head.txt`, `temp-orchestrator-head.txt`, `src/deactive_App.css`,
   carpeta suelta `Guia maestra v2` duplicada del `.md`. Borrar.

---

## 4. Sistema de prompts — evaluación

**Funciona y está bien diseñado**: pipeline secuencial con contratos JSON, guardrails editoriales
por edad y por agente, sanitizado anti-moraleja en dos capas, RAG V2 con presupuesto adaptativo de
chunks según señales pedagógicas, temperatura por rol (0.7 / 0.8 / 0.6). Nivel alto para un MVP.

**Margen de mejora (por impacto):**

1. **No hay jerarquía de señales — la causa técnica de la dilución que has detectado.**
   `buildPedagogySection` concatena TODO lo seleccionado en 5 listas planas
   (`Retos: a, b, c — Habilidades: d, e — Valores: f, g...`) y le pide al modelo trabajarlo todo
   "de forma sutil". Con 6-8 señales en un cuento de 10 páginas (≈300 palabras en `little`), el
   modelo reparte y nada se trabaja de verdad. **El fix de prompts va de la mano del fix de
   formulario (§5): un solo objetivo + un ancla.**
2. **Se inyectan IDs crudos en inglés** (`tantrums`, `night-fears`, `new-sibling`) dentro de un
   prompt en español. El modelo los entiende, pero pierde matiz. Crear un diccionario compartido
   `id → frase operativa` (ej. `night-fears` → "gestionar el miedo a la oscuridad y a dormir solo,
   transformándolo en sensación de seguridad") que alimente tanto la UI como los prompts y la query
   RAG.
3. **Orden tenant/guardrails invertido** (ver §2 Medios) — es de seguridad pero se arregla aquí.
4. **Límite de palabras solo se avisa** (`console.warn`), únicamente `baby` se trunca. Para
   `tiny/little/reader`: reintento dirigido o truncado por frases completas.
5. **Modelo de imagen hardcodeado** (`gemini-3.1-flash-image-preview` en
   `imageGenerationService.ts:39`): es un modelo *preview* que Google puede retirar sin aviso.
   Mover a env/config con fallback.
6. **Sanitizadores duplicados** entre `narrativeAgent` y `storytellingAgent` (regex anti-moraleja
   casi idénticas) → extraer a `utils/didacticSanitizer.ts` con un solo set de tests.
7. **Cobertura del objetivo a lo largo del cuento**: añadir al Storytelling la regla explícita
   "el objetivo pedagógico debe estar presente como hilo de acción en las páginas 4-9; la pasión
   del niño es el escenario de TODAS las páginas". Hoy la estructura fija de 10 páginas no dice
   dónde debe vivir el foco.

---

## 5. Rediseño del Paso 2 "El Viaje Interior" — modelo **Ancla + Foco**

### 5.1 La idea (la tuya, formalizada)

> En 10 páginas no caben 8 mensajes. Cabe **un universo** y **una transformación**.

- **ANCLA = la gran pasión o sueño.** Siempre presente, primera pregunta, una sola selección.
  No es un objetivo pedagógico: es el **mundo donde ocurre el cuento** y el motor de motivación
  (bibliotherapy básica: el niño se engancha si la historia habla de lo que ama).
- **FOCO = una sola cosa a trabajar.** Los encabezados actuales dejan de ser 4 acordeones
  multi-select y pasan a ser **4 tarjetas excluyentes** (radio). Al tocar una, se despliegan sus
  sub-opciones (también selección única) + campo "Otro".
- **Moduladores opcionales** (no añaden objetivos, matizan): 1 valor de refuerzo, 1-2 rasgos de
  personalidad, contexto libre.

Señales máximas que llegan al prompt: **ancla (1) + foco (1) + valor (0-1) + rasgos (0-2) + matiz**.
Concentración garantizada.

### 5.2 Flujo UI propuesto

```
[Toggle] ¿Quieres personalizar el mensaje del cuento?
   │
   ├─ 2A · EL MUNDO — "¿Cuál es su gran pasión o sueño?"  (chips, 1 selección, siempre visible)
   │
   ├─ 2B · LA MISIÓN — "¿Qué quieres que trabaje este cuento?"
   │       4 tarjetas grandes (elige UNA):
   │       ┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
   │       │ 🌋 Emociones y   │ 🌈 Una situación │ ⭐ Una habilidad │ 💎 Un valor para │
   │       │   conducta      │   que vive      │   a potenciar   │   toda la vida  │
   │       └─────────────────┴─────────────────┴─────────────────┴─────────────────┘
   │       → al elegir tarjeta se despliegan sus chips (1 selección + Otro)
   │       → línea opcional de matiz: "¿Quieres contarnos algo de esto?" (80 chars)
   │
   ├─ 2C · EL TOQUE FINAL (colapsado, opcional)
   │       · "¿Cómo es tu peque?" — rasgos de personalidad (máx 2)
   │       · "¿Un valor extra para el final?" — solo si el foco NO es un valor (máx 1)
   │       · "¿Algo más que debamos saber?" — textarea actual
   │
   └─ RESUMEN VIVO (se actualiza al seleccionar):
       "La pasión de Lucía por los 🦕 dinosaurios será el escenario de una aventura
        para trabajar 🌙 los miedos nocturnos, con un toque final de 💪 valentía."
```

Si el usuario cambia de tarjeta en 2B, la selección anterior se descarta (con micro-animación,
sin modal). El contador "N seleccionados" desaparece: ya no hay nada que contar.

### 5.3 Taxonomía completa propuesta

Lo que pedías: contextos, personalidad, habilidades, situaciones especiales, valores y
"zonas erróneas". Organizado así:

**ANCLA — Pasiones y sueños** (ampliada de 8 a 15, calibrada a 0-7 años):

| | | |
|---|---|---|
| ⚽ Fútbol | 💃 Baile | 🚀 Espacio y ciencia |
| 🖌️ Arte y pintar | 🦁 Animales | 🎵 Música |
| 👨‍🍳 Cocina | 🏃 Deportes | 🦕 Dinosaurios |
| 🧚 Hadas y magia | 🦸 Superhéroes | 🌊 Mar y piratas |
| 🚒 Vehículos y máquinas | 🌳 Naturaleza y explorar | 📚 Cuentos e historias |
| ✏️ Otro… | | |

**FOCO A — Emociones y conducta** (las "zonas erróneas": patrones que atascan, en positivo):

| id | Chip | Frase operativa para el prompt (ejemplo) |
|---|---|---|
| frustration | 🌋 Rabietas y frustración | tolerar la frustración y pedir ayuda antes de explotar |
| night-fears | 🌙 Miedos nocturnos | transformar el miedo a la oscuridad en sensación de seguridad |
| shyness | 🙈 Timidez | atreverse a participar y hablar sin dejar de ser uno mismo |
| sibling-rivalry | 👶 Celos de hermanos | encontrar su lugar especial cuando hay que compartir el cariño |
| separation | 💛 Ansiedad de separación | confiar en que mamá/papá siempre vuelven |
| sharing | 🤝 Compartir y turnos | descubrir que compartir multiplica el juego |
| eating | 🥦 Comer mejor | curiosidad y valentía para probar alimentos nuevos |
| sleep-alone | 🛏️ Dormir solo | convertir su cama en su refugio de valientes |
| pacifier-diaper | 🍼 Dejar chupete / pañal | despedirse de una etapa sintiéndose mayor |
| screens | 📱 Menos pantallas | redescubrir lo divertido del juego sin pantallas |
| listening | 👂 Escuchar y respetar límites | entender por qué las normas cuidan |
| perfectionism | 🎯 Miedo a equivocarse | equivocarse es parte de aprender y de jugar |
| goodbyes | 👋 Las despedidas | despedirse sin pena: lo bueno vuelve |

**FOCO B — Situaciones especiales** (contexto vital que el cuento ayuda a procesar):

| | | |
|---|---|---|
| 👶 Nuevo hermano | 📦 Mudanza | 🏫 Cambio de cole / adaptación |
| 🌈 Pérdida de un ser querido | 🐾 Pérdida de una mascota | 💛 Separación de los padres |
| 🏥 Enfermedad u hospital (propio) | ❤️‍🩹 Enfermedad de un familiar | 🐕 Nueva mascota |
| 👨‍👩‍👧 Nueva figura en la familia | ✈️ Familia lejos / nueva ciudad o idioma | 😢 Burlas en el cole |
| ✏️ Otro… | | |

**FOCO C — Habilidades a potenciar:**

| | | |
|---|---|---|
| 📚 Amor por la lectura | ⭐ Autonomía ("yo solo") | 🎨 Creatividad |
| 🧩 Resolver problemas | 🎯 Concentración | 🐢 Paciencia y esperar |
| 🗣️ Expresar lo que siente | 🤲 Pedir ayuda | 👫 Jugar en equipo |
| 🔬 Curiosidad científica | 📋 Orden y rutinas | 💪 Confianza en su cuerpo |

**FOCO D — Valores a transmitir:**

| | | |
|---|---|---|
| ❤️ Empatía | 💪 Perseverancia | ✨ Honestidad |
| 🌍 Respeto y diversidad | 🦁 Valentía | 🙏 Gratitud |
| 🤜🤛 Trabajo en equipo | 💖 Amor propio | 🎁 Generosidad |
| 🌱 Cuidar la naturaleza | 🤗 Amistad | 🔑 Responsabilidad |

**MODULADOR — Personalidad del protagonista** (máx 2 — calibra CÓMO reacciona el héroe, no QUÉ
se trabaja):

| | | |
|---|---|---|
| 🌸 Sensible | ⚡ Movido y enérgico | 🐢 Cauto y prudente |
| ☁️ Soñador | 🗣️ Charlatán | 🔍 Observador |
| 👑 Le gusta liderar | 🐭 Tímido al principio | 😂 Payasete de la casa |

**CONTEXTOS cotidianos** — los tienes cubiertos sin pregunta extra: el *escenario emocional* lo da
la situación/reto elegido (cole, casa, cama, mesa…) y el *escenario narrativo* lo da la pasión.
Recomiendo **no** añadir una pregunta de contexto: sería la sexta pregunta y volveríamos al
problema original. Si un padre quiere precisar ("le pasa sobre todo en el comedor del cole"),
para eso está el matiz de 80 caracteres del foco.

### 5.4 Modelo de datos v2

```ts
export type FocusCategory = 'emotion-behavior' | 'life-situation' | 'skill' | 'value';

export interface PedagogyProfileV2 {
  enabled: boolean;
  /** ANCLA: pasión o sueño — el mundo del cuento */
  anchor: { id: string; custom?: string } | null;
  /** FOCO: la única cosa a trabajar */
  focus: {
    category: FocusCategory;
    id: string;
    custom?: string;
    nuance?: string;          // matiz opcional de 1 línea
  } | null;
  /** Valor de refuerzo (solo si focus.category !== 'value') */
  reinforcementValue: string | null;
  /** Moduladores de caracterización (máx 2) */
  personalityTraits: string[];
  freeformContext?: string;
}
```

Migración: `PedagogyProfile` legacy se mantiene como tipo de entrada del pipeline con un adaptador
`toV2()` (si llegan varias selecciones antiguas, la primera del array gana), para no romper
`ragService`, traces ni mocks de una vez.

### 5.5 Cómo cambia el prompt del Narrative Agent

Sustituir la lista plana de `buildPedagogySection` por un contrato jerárquico:

```
ANCLA NARRATIVA (el mundo del cuento): {pasión → frase}
→ La aventura DEBE transcurrir en este universo. Es escenario y motivación,
  NO el objetivo pedagógico.

OBJETIVO PEDAGÓGICO ÚNICO: {foco → frase operativa del diccionario}
{matiz del padre, si existe}
→ Todo el arco (problema, decisión, clímax, resolución) trabaja SOLO este objetivo.
→ Está PROHIBIDO introducir otros aprendizajes que compitan con él.

VALOR DE REFUERZO (opcional): {valor}
→ Emerge en la resolución como consecuencia natural. No genera trama propia.

PERSONALIDAD DEL PROTAGONISTA: {rasgos}
→ Modulan sus reacciones y su voz. No añaden objetivos.
```

Y en el Storytelling Agent, una regla nueva:
`"El objetivo pedagógico es el hilo de acción de las páginas 4-9. La pasión del protagonista es
el escenario visible en TODAS las páginas."`

El diccionario `id → frase operativa` (columna 3 de las tablas de arriba) vive en un solo archivo
(`src/config/pedagogyCatalog.ts`) que alimenta: chips de la UI, prompts y query semántica del RAG.
Se acabó inyectar `tantrums, night-fears` en crudo.

---

## 6. Persistencia del cuento en móvil

### Diagnóstico

El cuento generado (`pages` con 10 imágenes base64) vive **solo en el estado de React**
(`App.tsx:238`). En móvil, al cambiar de app o de pestaña, el SO descarta la página en cuanto
necesita memoria (y 10 PNG base64 son muchos MB); al volver, el navegador recarga → `appState:
'loading'` → **cuento perdido y crédito gastado**. El `beforeunload` actual solo avisa durante la
generación y no protege contra el *tab discard* (que no dispara ese evento).

### Plan en 2 fases

**Fase A — Persistencia local (rápida, sin backend):**
1. Guardar en **IndexedDB** (no localStorage: límite ~5MB) un registro
   `{ id, createdAt, heroName, ageGroup, agentBrief, pages, currentPageIndex }`.
2. Escribir **incrementalmente**: el brief al terminar la orquestación y cada página según se
   genera → si el móvil mata la pestaña a mitad, al volver se reanuda sin quemar otro crédito.
3. Al arrancar `App`, si hay un cuento < 7 días → restaurar directamente a `reading`
   (o banner "📖 Seguir leyendo el cuento de Lucía").
4. Guardar `currentPageIndex` en cada paso de página.

   *Límite conocido:* iOS Safari puede purgar IndexedDB tras ~7 días sin visitar el sitio.
   Cubre perfectamente el caso "cambio de app y vuelvo"; no sustituye a la Fase B.

**Fase B — "Mis cuentos" en servidor (retención + negocio):**
- La tabla `public.stories` **ya existe** en tu Supabase (con RLS activado y sin políticas).
- Subir imágenes a Supabase Storage + fila en `stories` → biblioteca "Mis cuentos" para usuarios
  logueados y **magic link por email** para sesiones anónimas B2B ("tu cuento te espera aquí").
- Esto convierte un fix técnico en un activo de retención (§7).

---

## 7. Negocio

### 7.1 Fugas de valor a cerrar ya

1. **El crédito se consume ANTES de generar** (`App.tsx:589-611`). Si Gemini da 429 o falla el
   pipeline, el padre pierde 4,97€/3 de valor → ticket de soporte o cliente quemado.
   Fix: consumir tras éxito con reserva previa, o refund automático en el `catch`
   (RPC `refund_credit` con el `story_session_id`).
2. **Seguridad de créditos** (§2): hasta cerrar los críticos, el sistema de cobro es decorativo
   frente a cualquier usuario técnico.
3. **Cuento perdido en móvil** (§6): tu comprador es mayoritariamente móvil; perder el producto
   nada más pagarlo es la peor experiencia posible de primera compra.

### 7.2 Generación en backend = requisito de negocio, no solo técnico

Mover el pipeline a una Vercel Function (`/api/generate`) resuelve de golpe: API key protegida,
créditos imposibles de saltar (se validan server-side en la misma llamada), reanudación tras crash
del móvil, y posibilidad de email "tu cuento está listo". Es tu roadmap V2 ya escrito en
`.claude/rules/serverless-api.md`; los hallazgos de §2 lo convierten en prioridad.

### 7.3 Palancas de crecimiento (orden sugerido)

| Palanca | Por qué | Esfuerzo |
|---|---|---|
| **"Mis cuentos" + link para compartir** | El padre comparte con abuelos/tíos → adquisición orgánica; cada cuento es una landing con CTA | M (tras Fase B §6) |
| **Email post-generación con PDF** | Rescata el problema móvil + canal de re-engagement (ya pides `customer_email` en B2B) | S |
| **Gift codes reales para "Regala Magia"** | El pack regalo hoy acredita al comprador; un código canjeable abre regalo real (cumpleaños = pico de demanda) | M |
| **Analytics de funnel del wizard** | 4 pasos sin telemetría: no sabes dónde abandonan (sospecha: Paso 1, 5 selects de rasgos) | S |
| **Dashboard B2B con conversión** | El tenant necesita ver "X cuentos → Y clics a mi tienda" para renovar packs; hoy compra a ciegas | M-L |
| **Libro físico print-on-demand** | Ticket 25-35€ con margen alto; el PDF de alta resolución ya existe | L |
| **Cuento 1 gratis con marca de agua (B2C)** | Bajar fricción de primera compra; decisión de CAC vs coste Gemini | decisión |

### 7.4 Cumplimiento (es ventaja competitiva en este nicho, no burocracia)

- **Fotos de menores → Gemini**: añadir checkbox de consentimiento explícito del tutor en el paso
  de foto + declarar el sub-encargado (Google) en la política de privacidad. Hoy la foto sale del
  navegador del padre directo a Gemini, lo cual es bueno (no la tocáis), pero hay que decirlo.
- Rotar los secretos filtrados (§2) también es obligación RGPD (emails de clientes en `tokens`).
- Activar leaked-password protection en Supabase (1 clic).

---

## 8. Roadmap sugerido

| # | Acción | Cuándo |
|---|---|---|
| 1 | SQL de seguridad (§2) + rotar claves Gemini/Pinecone + leaked-password ON | **Hoy** |
| 2 | `npm audit fix` + arreglar 2 errores de lint + limpiar residuos | Esta semana |
| 3 | Persistencia local Fase A (§6) | Esta semana |
| 4 | Form Paso 2 v2 "Ancla + Foco" + catálogo + prompts jerárquicos (§5) | Sprint siguiente |
| 5 | Refund/consumo post-éxito de créditos | Sprint siguiente |
| 6 | Generación en backend (`/api/generate`) | Antes de invertir en tráfico |
| 7 | Fase B "Mis cuentos" + email + compartir | Tras el backend |

---

## 9. Preguntas abiertas

1. **Foco estricto**: ¿confirmas foco = exactamente 1 (mi recomendación) o quieres permitir un
   secundario explícito ("trabajamos X, con un toque de Y") más allá del valor de refuerzo?
2. **Pasión obligatoria**: cuando el toggle de personalización está ON, ¿el ancla es obligatoria?
   (Recomiendo sí: sin ancla el "foco" vuelve a ser un cuento genérico con moraleja.)
3. **Personalidad**: ¿la incluimos en el Paso 2 como propongo, o encaja mejor en el Paso 1
   (El Protagonista), junto a los rasgos físicos?
4. **Persistencia**: ¿te vale empezar por la Fase A local esta semana y dejar "Mis cuentos"
   para después del backend?
5. **Seguridad**: ¿aplico yo directamente la migración SQL de §2 en tu proyecto Supabase
   (tengo acceso vía MCP) o prefieres revisarla y aplicarla tú?
