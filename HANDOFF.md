# HANDOFF.md — NubeKids Platform

> **Última actualización:** 2026-04-04 (B2B seguro con token one-time validado en producción)
> **Estado:** ✅ Fase 10 COMPLETADA — Funnel B2B2C end-to-end funcional
> **Próximo paso:** Fase 11 — Dominio + Deploy + Legal

---

## 🎉 LOGROS DE HOY (02 Abril 2026)

### Fase 10 — Flujo B2B → B2C completo ← HOY

1. ✅ **`src/types.ts`** — Añadidos `B2BSessionParams`, `B2BSession`, `PaymentSource`, `PaymentDecision`
2. ✅ **`src/services/queryParamsService.ts`** — `?tenant=...` relegado a demo/testing con `demo=1`
3. ✅ **`src/services/sessionService.ts`** — `resolvePayment()`: lógica de quién paga el crédito
4. ✅ **`src/utils/itemImageLoader.ts`** — Descarga imagen del producto con 3 fallbacks CORS (fetch → canvas → url-only)
5. ✅ **`src/App.tsx`** — Flujo B2B real por `?token=...`, demo por `?tenant=...&demo=1`, `post-story` y `promo-unavailable`
6. ✅ **`src/components/Setup.tsx`** — Props `initialItemImage`, `initialItemImageUrl`, `initialItemModel` funcionales. Bug corregido: `initialItemModel` ya se aplica a `itemData.description`
7. ✅ **`src/components/wizard/StepItem.tsx`** — Pre-rellenado B2B, badge "Cargado automáticamente", fallback CORS con "Solo vista previa"
8. ✅ **`src/components/PostStoryActions.tsx`** — CTA post-lectura con pricing, botón "Crear otro" → registro B2C
9. ✅ **`src/components/auth/SignUpPage.tsx`** — `initialEmail` pre-rellenado con banner de conversión
10. ✅ **`src/index.css`** — Fix fuentes: importar Fredoka + Nunito desde Google Fonts
11. ✅ **`src/components/credits/BuyCredits.tsx`** — Fix `Fredoka One` → `Fredoka`
12. ✅ **`docs/nubekids_b2b2c_simulator.html`** — Herramienta de testing con 5 escenarios, checklist de Done y log
13. ✅ **`docs/INTEGRACION_PREMIUM.md`** — Guía de integración B2B segura por token one-time
14. ✅ **Deploy en Vercel exitoso** — TypeScript sin errores, build verde

### Refactor de modelo (04 Abril 2026)

1. ✅ **`src/types.ts`** — Nuevo campo `itemInteractionMode` en `TenantConfig`
2. ✅ **`src/utils/itemInteraction.ts`** — Helper central para semántica narrativa/visual del objeto
3. ✅ **`src/config/tenants/*.config.ts`** — `shoe-store-default` y `fashion-store-default` unificados bajo `wearable`
4. ✅ **`src/services/agents/*.ts`** — Narrative, Storytelling y Visual Brief ya usan `itemInteractionMode`
5. ✅ **Compatibilidad demo preservada** — Las URLs `?tenant=shoe-store-default&demo=1` y `?tenant=fashion-store-default&demo=1` siguen siendo válidas para testing interno

### Cierre de riesgo B2B (04 Abril 2026)

1. ✅ **`api/b2b/create-token.ts`** — Nueva API serverless para emitir enlaces one-time `/?token=...`
2. ✅ **`supabase/migrations/20260404_b2b_secure_token_flow.sql`** — Función RPC `consume_b2b_token()` + soporte a `used_at`, `created_at` e `integration_secret_hash`
3. ✅ **`src/services/tokenService.ts`** — Validación alineada con `credit_accounts.balance` y consumo atómico via RPC
4. ✅ **`src/App.tsx`** — El flujo real de comprador final vuelve a ser `?token=...`
5. ✅ **`docs/nubekids_b2b2c_simulator.html`** — `?tenant=` pasa a ser demo explícita con `demo=1`
6. ✅ **Validación manual real completada** — token B2B de prueba consumido con éxito; balance del tenant de test pasó de 10 a 9

### Activación B2B V1 (04 Abril 2026)

1. ✅ **`public/b2b.html`** — CTAs públicos redirigidos a `Solicitar activación` en vez de compra directa sin tenant
2. ✅ **Formulario first-party** — bloque `Solicitar activación` con email, WhatsApp, tipo de catálogo, plan de interés y preferencia de contacto
3. ✅ **`api/b2b/activation-request.ts`** — API serverless para guardar leads B2B en Supabase
4. ✅ **`supabase/migrations/20260404_b2b_activation_requests.sql`** — Tabla `b2b_activation_requests` con estados operativos (`new`, `contacted`, `qualified`, `activated`, `rejected`)
5. ✅ **Copy operativo en la landing** — “Te activamos la tienda y te damos acceso”

### Decisiones tomadas en esta sesión
- **`storeName` visible en ambos planes**: Standard y Premium muestran el nombre de la tienda en Step 3
- **Fallback CORS graceful**: si la imagen no se puede convertir a base64, se muestra como preview visual pero no se envía a Gemini — el cuento usa la descripción textual
- **`post-story` como estado separado**: no modifica la state machine existente, `b2bSession.storyGenerated` controla la bifurcación en `handleReset`
- **Test CORS no simulable con URLs públicas**: la mayoría de CDNs modernos envían headers CORS correctos; el fallback se activará con CDNs privados de e-Commerce
- **Integración Premium requiere desarrollo técnico en el e-Commerce**: documentado en `docs/INTEGRACION_PREMIUM.md`
- **Landings estáticas en `/public`**: sin React Router, HTML puro servido directamente por Vercel
- **`itemInteractionMode` como fuente de verdad narrativa**: `tenant` sigue representando identidad comercial/branding; la semántica de uso del objeto ya no depende de `shoe-store` vs `fashion-store`
- **Tenants demo legacy se mantienen**: `shoe-store-default` y `fashion-store-default` siguen existiendo por compatibilidad, pero no deben marcar la evolución futura del modelo
- **`direct-b2c` usa `generic`**: B2C no se fuerza artificialmente a `wearable` ni `interactive`
- **Onboarding B2B V1 = alta manual asistida**: no habrá self-serve B2B mientras el volumen de leads no justifique asumir la complejidad extra en auth, roles, provisioning y pagos
- **Formulario propio simple como punto de entrada B2B**: capturamos el lead en nuestra propia base de datos y pedimos email + WhatsApp dentro del formulario
- **No hace falta WhatsApp Business en V1**: WhatsApp se usa como dato de contacto preferido, no como integración automatizada
- **Flujo B2B seguro restaurado**: el enlace real para comprador final vuelve a ser `/?token=...`
- **`?tenant=` deja de ser enlace comercial válido**: queda reservado a demo/testing interno con `demo=1`
- **Validación comercial mínima ya hecha**: se verificó que el enlace B2B one-time funciona, genera el cuento y consume exactamente 1 crédito

---

## ⚠️ PASOS MANUALES PENDIENTES

### 0. Revisar solicitudes B2B entrantes
- Tabla: `b2b_activation_requests`
- Filtro inicial recomendado: `status = 'new'`
- Orden: `created_at DESC`
- Canal de respuesta:
  - si `preferred_contact = whatsapp` y hay número → WhatsApp manual
  - en cualquier caso, mantener email como respaldo formal

### Runbook de alta manual (`tenant` + `tenant_owner`)
1. Revisar la fila en `b2b_activation_requests` y validar si el caso encaja con el onboarding actual.
2. Cambiar `status` a `contacted` cuando se haya respondido por primera vez.
3. Crear el `tenant` en Supabase con branding e `integration_level` acordado.
4. Crear o preparar la `credit_account` del tenant si procede.
5. Crear el usuario en Supabase Auth (manual/invitación) y luego actualizar `profiles.role = 'tenant_owner'`.
6. Asociar `profiles.tenant_id` al tenant recién creado.
7. Verificar acceso al flujo de compra B2B (`/buy-credits-b2b`) con el contexto de tenant correcto.
8. Cambiar la solicitud a `status = 'activated'` cuando el acceso esté entregado.

### Runbook de integración segura B2B (`token` one-time)
1. Crear el `tenant` en Supabase con su `tenant_id` público y branding.
2. Generar un secreto de integración por tenant y guardar solo su hash SHA-256 en `tenants.integration_secret_hash`.
3. Compartir el secreto al equipo técnico del e-Commerce por canal seguro.
4. El e-Commerce llama a `POST /api/b2b/create-token` desde backend con header `x-nubekids-tenant-secret`.
5. NubeKids devuelve una URL final `/?token=...`.
6. El comprador usa esa URL una sola vez.
7. `consume_b2b_token()` descuenta de forma atómica 1 token + 1 crédito del tenant.
8. `?tenant=` solo se usa en demo/testing interno con `demo=1`.

### Runbook de test para nuevos tokens
1. Mantener un tenant de pruebas con saldo controlado, por ejemplo `tenant-b2b-test`.
2. Emitir un token nuevo para cada prueba. No reutilizar tokens ya consumidos.
3. Para test rápido manual, insertar un token en `public.tokens` o emitirlo con `POST /api/b2b/create-token`.
4. Abrir la URL `/?token=...` en la preview o en producción.
5. Tras generar, verificar:
   - `tokens.is_used = true`
   - `credit_accounts.balance` del tenant disminuye en 1
6. Para una segunda prueba, crear otro token nuevo (`nkt_manual_test_002`, `nkt_manual_test_003`, etc.).
7. Referencia operativa: `docs/b2b_tenant_activation_and_token_test_guide.md`.

### 1. Sincronizar precios B2B
- Los precios B2B en la landing `public/b2b.html` pueden diferir de los de Stripe y `credit_packs`
- Revisar y alinear antes del lanzamiento

### 2. Google OAuth (cuando se tenga dominio)
- Google Cloud Console → OAuth 2.0 Client ID
- Redirect URI: `https://eyirhuxpqaneiehnmguq.supabase.co/auth/v1/callback`
- Supabase Dashboard → Authentication → Providers → Google

### 3. Webhook Stripe en producción
- Cuando se compre dominio propio → actualizar la URL en Stripe Dashboard
- `Developers → Webhooks → [endpoint] → Update`

---

## 🎯 Estado del Proyecto

| Fase | Estado | Notas |
|------|--------|-------|
| Fase 1 — Multitenancy | ✅ Completa | Tenants, tokens, Supabase |
| Fase 2 — Wizard Setup | ✅ Completa | 4 steps, validación |
| Fase 3 — Sistema Multiagente + RAG V1 | ✅ Completa | Orchestrator + 3 agentes |
| Fase 4 — Imágenes + Book | ✅ Completa | Gemini images + page-flip + PDF |
| Fase 5 — RAG V2 pgvector | ✅ Completa | 3105 chunks, búsqueda semántica |
| Fase 6 — Bugfix + Estabilización | ✅ Completa | Todos los bugs críticos resueltos |
| Fase 7 — Autenticación | ✅ Completa | Supabase Auth + Google OAuth |
| Fase 8 — Sistema de Créditos | ✅ Completa | Prepago funcional end-to-end |
| Fase 9 — Stripe | ✅ Completa | Pago end-to-end verificado |
| Fase 10 — Flujo B2B → B2C | ✅ **COMPLETA** | **Funnel completo funcional** ← HOY |
| Fase 11 — Deploy + Dominio + Legal | ⏳ Pendiente | Vercel ✅, falta dominio + legal |
| Fase 12 — Dashboard Tenant | 🔮 Futuro | Post-lanzamiento |

---

## 📐 Decisiones de Arquitectura

| Decisión | Razón |
|----------|-------|
| **Sin FK a tenants en credit_accounts** | `tenants.id` es UUID pero `tenant_id` en tokens es TEXT — incompatibilidad de tipos |
| **RLS con `tenant_id IS NOT NULL`** | Sesiones anónimas B2B no tienen `auth.uid()` |
| **`.maybeSingle()` en lugar de `.single()`** | PostgREST devuelve 406 con `.single()` cuando no hay filas |
| **Sin React Router** | State machine con estados string — SPA simple sin overhead de router |
| **`consumeCredit()` ANTES de orquestar** | Si falla la generación, el crédito se pierde — aceptable en V1 |
| **Stripe Checkout Sessions (no Elements)** | PCI compliance automático, sin UI de pago que construir |
| **Stripe modo LIVE desde el inicio** | Cuenta separada y limpia para NubeKids |
| **Precio B2C desde 4.99€** | Ancla de valor: 6x más barato que Wonderbly |
| **`b2bSession` separado del flujo principal** | No modifica la state machine existente |
| **Fallback CORS en 3 intentos** | fetch → canvas → url-only. Degrada gracefully sin romper el flujo |
| **`post-story` como AppState** | CTA de conversión B2B→B2C sin interferir con el estado `reading` |
| **Landings en `/public` como HTML estático** | Carga instantánea, SEO friendly, independientes del SPA |
| **`itemInteractionMode` desacoplado de `tenant`** | `tenant` define branding e identidad comercial; `itemInteractionMode` define cómo el niño usa el objeto en narrativa e imagen |
| **Formulario B2B first-party + alta manual** | Capturamos leads en base propia y activamos manualmente el tenant antes de permitir compra B2B |
| **B2B real por token one-time** | 1 compra = 1 token = 1 cuento; evita agotar el saldo del tenant por enlaces compartidos |

---

## 🧠 Nota Operativa Importante

- **No usar `shoe-store-default` y `fashion-store-default` como semántica de producto**: desde el refactor del 04/04/2026 esos IDs son tenants demo/legacy compatibles con URLs existentes.
- **La fuente de verdad para comportamiento narrativo y visual es `itemInteractionMode`**.
- **Asignación actual**:
  - `shoe-store-default` → `wearable`
  - `fashion-store-default` → `wearable`
  - `direct-b2c` → `generic`
- **Implicación práctica**: futuros tenants B2B no deben crearse siguiendo la taxonomía `shoe-store` / `fashion-store`; deben definirse por branding comercial y por `itemInteractionMode`.
- **Decisión operativa vigente para B2B**: el alta de nuevos tenants será asistida/manual en V1. El self-serve B2B queda explícitamente pospuesto hasta que haya demanda que lo justifique.
- **Canal operativo recomendado para B2B V1**: formulario propio simple en `public/b2b.html`, con email obligatorio y WhatsApp opcional/recomendado como canal preferido.
- **Fuente de verdad para enlaces B2B de cliente final**: `/?token=...`
- **Uso permitido de `?tenant=`**: solo demo/testing interno y siempre con `demo=1`
- **Guía operativa B2B**: usar `docs/b2b_tenant_activation_and_token_test_guide.md` para alta de `tenant_owner`, saldo de test y validación one-time

---

## 📁 Estructura de Archivos Actual
```
D:\nubekids-tales\
├── .env.local
├── package.json
├── pnpm-lock.yaml
│
├── api/
│   ├── b2b/
│   │   ├── activation-request.ts           # ✅ NUEVO — captura leads B2B en Supabase
│   │   └── create-token.ts                 # ✅ NUEVO — emite enlaces B2B one-time `/?token=...`
│   └── stripe/
│       ├── create-checkout.ts
│       └── webhook.ts
│
├── public/
│   ├── b2b.html                             # ✅ CTA a activación + formulario propio B2B
│   └── b2c.html                             # Landing B2C (estática)
│
├── docs/
│   ├── b2b_tenant_activation_and_token_test_guide.md # ✅ NUEVO — runbook de alta tenant + tenant_owner + test one-time
│   ├── nubekids_b2b2c_simulator.html        # ✅ NUEVO Fase 10 — Herramienta testing
│   └── INTEGRACION_PREMIUM.md              # ✅ Actualizada — guía segura por token one-time
│
├── supabase/
│   └── migrations/
│       ├── 001_profiles_and_trigger.sql
│       ├── stripe_price_id.sql
│       ├── 20260404_b2b_activation_requests.sql   # ✅ NUEVO — tabla leads B2B
│       └── 20260404_b2b_secure_token_flow.sql     # ✅ NUEVO — consumo atómico token + crédito tenant
│
├── src/
│   ├── App.tsx                              # ✅ B2B real por token + demo por tenant + post-story
│   ├── main.tsx
│   ├── types.ts                             # ✅ B2BSessionParams demo-only, B2BSession, PaymentDecision
│   ├── index.css                            # ✅ Fix: Fredoka + Nunito importadas
│   │
│   ├── lib/
│   │   └── supabase.ts
│   │
│   ├── context/
│   │   └── AuthContext.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useCredits.ts
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignUpPage.tsx               # ✅ initialEmail prop
│   │   │   └── AuthCallback.tsx
│   │   ├── credits/
│   │   │   ├── CreditBalance.tsx
│   │   │   ├── NoCreditsBanner.tsx
│   │   │   ├── BuyCredits.tsx               # ✅ Fix fuentes
│   │   │   └── CreditsSuccess.tsx
│   │   ├── PostStoryActions.tsx             # ✅ NUEVO Fase 10
│   │   ├── Book.tsx
│   │   ├── Setup.tsx                        # ✅ initialItemImage, initialItemImageUrl
│   │   └── wizard/
│   │       ├── StepHero.tsx
│   │       ├── StepPedagogy.tsx
│   │       ├── StepItem.tsx                 # ✅ pre-rellenado B2B + fallback CORS
│   │       └── StepStory.tsx
│   │
│   ├── services/
│   │   ├── authService.ts
│   │   ├── creditService.ts
│   │   ├── stripeService.ts
│   │   ├── imageGenerationService.ts
│   │   ├── dependencies.ts
│   │   ├── ragService.ts
│   │   ├── tokenService.ts
│   │   ├── queryParamsService.ts            # ✅ NUEVO Fase 10
│   │   ├── sessionService.ts               # ✅ NUEVO Fase 10
│   │   └── agents/
│   │       ├── orchestratorAgent.ts
│   │       ├── narrativeAgent.ts
│   │       ├── storytellingAgent.ts
│   │       └── visualBriefAgent.ts
│   │
│   ├── utils/
│   │   ├── pdfExport.ts
│   │   ├── jsonParser.ts
│   │   ├── itemInteraction.ts          # ✅ NUEVO Refactor tenant → itemInteractionMode
│   │   └── itemImageLoader.ts              # ✅ NUEVO Fase 10
│   │
│   └── config/
│       └── tenants/
```

---

## 🗄️ Supabase — Tablas Actuales

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `tenants` | Configuración de tenants B2B | ✅ |
| `tokens` | Tokens B2B one-time para cliente final | ✅ |
| `rag_chunks` | Chunks RAG con embeddings pgvector | ✅ |
| `profiles` | Extiende auth.users con rol | ✅ Fase 7 |
| `credit_accounts` | Balance de créditos (tenant o user) | ✅ Fase 8 |
| `credit_transactions` | Historial de movimientos | ✅ Fase 8 |
| `credit_packs` | Catálogo de 9 packs con stripe_price_id | ✅ Fase 9 |
| `b2b_activation_requests` | Solicitudes de activación B2B desde la landing | ✅ V1 activación asistida |

**Funciones RPC:**
- `consume_credit(p_tenant_id, p_user_id, p_story_session_id)` → BOOLEAN
- `add_credits(p_tenant_id, p_user_id, p_amount, p_stripe_payment_intent_id)` → INTEGER
- `consume_b2b_token(p_token, p_story_session_id)` → JSONB
- `match_rag_chunks(query_embedding, match_threshold, match_count)` → TABLE

---

## 💳 Stripe — Productos Creados

> **Precios actualizados:** 2026-04-02 — nueva estructura de pricing
> Los price IDs anteriores siguen activos en Stripe pero ya no se usan en el código.

| Clave interna | Nombre en Stripe | Precio | Price ID activo |
|---|---|---|---|
| `b2c-trial` | NubeKids · 1 cuento | 4,97 € | `price_1THqytDcvABCRuSUPk916Hmh` |
| `b2c-family` | NubeKids · 3 cuentos | 13,90 € | `price_1THr0aDcvABCRuSUGGveajZp` |
| `b2c-gift` | NubeKids · 5 cuentos | 21,90 € | `price_1THr0dDcvABCRuSUYFWdpMUw` |
| `b2b-std-starter` | NubeKids · 50 cuentos \| Tiendas | 97,00 € | `price_1THr0gDcvABCRuSUDbG88ec5` |
| `b2b-std-growth` | NubeKids · 200 cuentos \| Tiendas | 340,00 € | `price_1THr0jDcvABCRuSUUDmhC5Yk` |
| `b2b-std-scale` | NubeKids · 500 cuentos \| Tiendas | 790,00 € | `price_1THr0nDcvABCRuSUvow235eV` |
| `b2b-prm-starter` | NubeKids · 50 cuentos \| Premium | 145,00 € | `price_1THr0tDcvABCRuSUOhOTtFp7` |
| `b2b-prm-growth` | NubeKids · 200 cuentos \| Premium | 490,00 € | `price_1THr0wDcvABCRuSU7AS3UV7s` |
| `b2b-prm-scale` | NubeKids · 500 cuentos \| Premium | 990,00 € | `price_1THr0zDcvABCRuSUXNcyPt12` |

### Price IDs anteriores (obsoletos — no borrar de Stripe)
| `b2c-trial` | 4,99 € | `price_1THOLwDcvABCRuSU3NcAhy5B` |
| `b2c-family` | 12,99 € | `price_1THOM4DcvABCRuSUQtxVIH2B` |
| `b2c-gift` | 19,99 € | `price_1THOMBDcvABCRuSUtGWwVFkC` |
| `b2b-std-starter` | 25,00 € | `price_1THOMJDcvABCRuSUOTLGL2Gp` |
| `b2b-std-growth` | 79,00 € | `price_1THOMQDcvABCRuSUODiMlvBm` |
| `b2b-std-scale` | 159,00 € | `price_1THOMYDcvABCRuSU4p2FmSDu` |
| `b2b-prm-starter` | 39,00 € | `price_1THOMgDcvABCRuSUCwzqnhLp` |
| `b2b-prm-growth` | 129,00 € | `price_1THOMpDcvABCRuSUz0DcZvsf` |
| `b2b-prm-scale` | 259,00 € | `price_1THOMxDcvABCRuSUbbFEijDA` |

## 🔧 Variables de Entorno
```env
# .env.local — Frontend (prefijo VITE_)
VITE_SUPABASE_URL=https://eyirhuxpqaneiehnmguq.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_GEMINI_API_KEY=xxx
VITE_USE_MOCK=true

# .env.local — Backend serverless (sin prefijo VITE_)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SUPABASE_URL=https://eyirhuxpqaneiehnmguq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
FRONTEND_URL=http://localhost:5173
```

---

## 🔌 Dependencias Clave

| Paquete | Versión | Uso | Estado |
|---------|---------|-----|--------|
| `@google/genai` | ^1.46.0 | Gemini texto + imagen + embeddings | ✅ |
| `@supabase/supabase-js` | latest | Auth + RAG + créditos | ✅ |
| `react-pageflip` | ^2.0.3 | Book page-flip | ✅ |
| `jspdf` | ^2.x | Export PDF | ✅ |
| `stripe` | ^21.0.1 | Backend checkout sessions + webhook | ✅ |
| `@vercel/node` | ^5.6.23 | Tipos para serverless functions | ✅ |

---

## 🚀 Próximos Pasos — Fase 11

1. **Comprar dominio** (nubekids.io / nubekidstales.com)
2. **Configurar DNS** en Vercel
3. **Actualizar webhook Stripe** con URL de producción definitiva
4. **Google OAuth** — completar config en GCP con dominio definitivo
5. **Legal** — política de privacidad (GDPR, datos de menores), términos de servicio, aviso legal, cookies
6. **Landing B2C** — copy basado en investigación NotebookLM (pendiente)
7. **Sincronizar precios B2B** — landing vs Stripe vs Supabase
8. **Preparar kit comercial de validación B2B** — tenant demo con saldo, guía de test y procedimiento para demostrar one-time links a tiendas interesadas
9. **Probar emisión real via `/api/b2b/create-token`** — no solo inserción manual en `tokens`

---

## 📋 Deuda Técnica Conocida

| Item | Prioridad | Estado |
|------|-----------|--------|
| Sincronizar precios B2B (landing vs Stripe vs Supabase) | Alta | ⏳ Pendiente |
| Integración B2B insegura por `?tenant=` | Alta | ✅ Resuelto — flujo real restaurado a token one-time |
| Algunas referencias históricas aún describen el modelo previo y deben leerse con nota de compatibilidad | Baja | ⚠️ Controlado con notas explícitas |
| Google OAuth config en GCP + Supabase | Media | ⏳ Cuando haya dominio |
| `consumeCredit` sin refund si falla generación | Media | Aceptable V1 |
| Webhook Stripe apunta a URL Vercel temporal | Media | Actualizar al tener dominio |
| Doble generación mismo usuario anónimo (2 pestañas) | Baja | Aceptable V1 |
| Violations react-pageflip touchstart | Baja | Ignorable (librería externa) |
| No hay tests unitarios | Alta | Pendiente |
| OCR para 4 PDFs de solo imágenes | Media | Pendiente |

---

## 🏆 GitHub

**Repo:** https://github.com/jav13rrez/nubekids-tales.git
**Branch:** main — deploy automático en Vercel en cada push ✅

---

## 📊 Resumen Ejecutivo
```
✅ Fase 1:  Multitenancy — COMPLETADA
✅ Fase 2:  Wizard Setup — COMPLETADA
✅ Fase 3:  Sistema Multiagente + RAG V1 — COMPLETADA
✅ Fase 4:  Generación imágenes + Book — COMPLETADA
✅ Fase 5:  RAG V2 pgvector — COMPLETADA
✅ Fase 6:  Bugfix + Estabilización — COMPLETADA
✅ Fase 7:  Autenticación (Supabase Auth + OAuth) — COMPLETADA
✅ Fase 8:  Sistema de Créditos — COMPLETADA
✅ Fase 9:  Stripe + Compra de Créditos — COMPLETADA
✅ Fase 10: Flujo B2B → B2C completo — COMPLETADA ← HOY
⏳ Fase 11: Deploy + Dominio + Legal — Vercel ✅, falta dominio + legal

🎯 ESTADO: MVP COMERCIAL COMPLETO
💳 PAGOS: Stripe end-to-end verificado en LIVE mode
🏪 B2B: Funnel completo Standard + Premium funcional
🚀 DEPLOY: Vercel funcionando en push automático
🌐 LANDINGS: B2B lista, B2C pendiente de copy

Falta para lanzamiento:
- Dominio propio + configuración DNS
- Legal (GDPR, términos, privacidad)
- Landing B2C (copy en investigación)
- Sincronizar precios B2B
- Operativa diaria de revisión de `b2b_activation_requests`

Estimación hasta lanzamiento: ~1 semana.
```

---

*Fase 10 completada. Funnel B2B2C funcional end-to-end. Listo para Fase 11. 🚀*
