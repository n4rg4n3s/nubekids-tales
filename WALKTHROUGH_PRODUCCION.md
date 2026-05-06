# Walkthrough — Camino Real a Producción

**Fecha:** 2026-05-06
**Branch actual:** `main` (commit `051f1b6`)
**Deploy actual:** `nubekids-tales.vercel.app`

---

## 1. Estado Real (no teórico)

El código del MVP está **completo y funcionando en dispositivo físico**. Las últimas iteraciones (5 mayo) han sido pulido visual del flujo móvil basado en feedback directo desde iPhone real, no desde emulador.

### Bugs móviles cerrados HOY en iPhone real

| Commit | Bug detectado en iPhone | Fix aplicado |
|--------|-------------------------|--------------|
| `08accd7` | Imagen recortada arriba/abajo (object-cover) + container 16:9 roto | Restaurado `aspectRatio: '4/5'` con `object-contain` y `SPREAD_RATIO 16/9` |
| `0928b48` | "Gira el móvil" no centrado verticalmente en portrait | `min-h-[100dvh]` en wrapper para que el centrado funcione |
| `051f1b6` | Container ya no era 16:9 (intento previo lo había estirado) | Restaurada restricción 16:9 en `computeBookSize` |

**Esto significa:** la validación móvil ya está sucediendo. Cada bug se reporta desde el iPhone, se corrige, se despliega vía Vercel y se reverifica. No hay "deuda de QA móvil pendiente"; hay un **proceso iterativo activo**.

---

## 2. Lo que SÍ está validado en dispositivo real

- Wizard de 4 pasos (Setup) en portrait — funcional
- Pantalla "Crear cuento" → orquestación → generación → libro — funcional
- Aviso "Gira el móvil" en portrait con card centrado (post `0928b48`) — funcional
- Lectura inmersiva landscape con container 16:9 (post `051f1b6`) — funcional
- Imagen 4:5 con `object-contain` que ocupa la altura disponible — funcional
- Texto de página (TextPage) con centrado vertical — funcional
- Navegación page-flip por tap/swipe — funcional (anteriormente reportado OK)

---

## 3. Lo que NO está validado todavía en iPhone real

Estas son las áreas donde, con sinceridad, no hay evidencia directa de pruebas en dispositivo aún:

1. **Export PDF móvil** — Modal "Guardar/Abrir/Descargar" + comportamiento real de `navigator.share({files})` en iOS Safari
   - Riesgo: iOS Safari puede rechazar el `canShare` si la blob es muy grande (>50MB) o el MIME type no le gusta
2. **Compra Stripe en móvil** — Flujo de checkout dentro del WebView de Safari en iPhone
   - Riesgo: redirects, cookies de sesión, persistencia tras volver del checkout
3. **Login Google OAuth** — actualmente bloqueado porque no hay dominio definitivo en GCP
4. **Generación completa con Premium B2B (token + foto inyectada)** end-to-end en iPhone — solo testeado parcialmente
5. **Refresco tras bloqueo de pantalla** — apagar pantalla durante generación y volver

---

## 4. Bloqueadores Reales para Producción

Ordenados por dependencia (cada uno desbloquea al siguiente):

### A. Comprar dominio definitivo (1h, ~15-30€/año)

- Recomendado: `nubekids.io` o `nubekidstales.com`
- Apuntar registros A/CNAME a Vercel (auto-config)
- Sin esto, no se pueden cerrar B, C, D

### B. Completar legales públicos (2-6h, posible coste asesor)

Archivos con placeholders en `/public/`:
- `aviso-legal.html`
- `condiciones-servicio.html`
- `politica-privacidad.html`
- `politica-cookies.html`

Datos a sustituir:
- `[NOMBRE EMPRESA]` → razón social
- `[NIF/CIF]` → identificación fiscal
- `[DIRECCIÓN]` → domicilio social completo
- `[TELÉFONO / EMAIL CONTACTO]`
- `[DATOS REGISTRALES]` → si hay inscripción mercantil
- `[CONTACTO DPD]` → delegado de protección de datos (si aplica)

Opcional pero recomendable: revisión por abogado especializado en RGPD/LSSI-CE.

### C. Reconfigurar Google OAuth con dominio final (1h)

1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 Client ID → Authorized redirect URIs
3. Añadir: `https://[supabase-project].supabase.co/auth/v1/callback`
4. Añadir Authorized JavaScript origins: `https://nubekids.io` (o el dominio elegido)
5. Verificar dominio en Google Search Console

### D. Actualizar webhook Stripe a URL definitiva (30min)

1. Stripe Dashboard → Developers → Webhooks
2. Editar endpoint actual (apunta a `*.vercel.app`)
3. Cambiar a `https://nubekids.io/api/stripe/webhook`
4. Verificar que sigue recibiendo eventos `checkout.session.completed` y `payment_intent.succeeded`
5. Probar con un pago real de prueba (1€)

### E. QA final en iPhone real con dominio nuevo (2h)

Checklist mínimo:
- [ ] Login Google OAuth funciona
- [ ] Compra de pack mínimo (97€) en LIVE mode con tarjeta real
- [ ] Crédito aparece en cuenta tras webhook
- [ ] Generación de cuento completo (B2C)
- [ ] Token B2B emitido vía API → consumido → cuento generado con foto producto
- [ ] Export PDF en iPhone Safari → modal nativo de "Compartir" → guardar en Files
- [ ] Tras cerrar el cuento, el contador de créditos refleja el consumo

### F. Operativa B2B — runbook de alta manual (proceso continuo)

Documentado en `docs/b2b_tenant_activation_and_token_test_guide.md`. No bloquea el lanzamiento técnico, pero sí el primer cliente B2B real.

Cada solicitud (`b2b_activation_requests`) requiere:
1. Crear `tenant` en Supabase
2. Crear `tenant_owner` (usuario administrativo)
3. Provisionar `credit_account` con saldo inicial (si aplica trial)
4. Generar `tenant_secret` y compartirlo de forma segura
5. Enviar email de bienvenida con instrucciones

Estimación: 30 min/solicitud durante V1.

---

## 5. Limpiezas pre-launch (no bloquean, pero deberían cerrarse)

1. **`PLANNING.md` tiene precios obsoletos** (líneas ~64-85)
   - Standard 25€-159€ → debe ser 97€-790€
   - Premium 39€-259€ → debe ser 145€-990€
   - Fuente de verdad: `HANDOFF.md` líneas 417-427

2. **Tenants legacy** `shoe-store-default`, `fashion-store-default` siguen funcionando pero deprecan
   - No usar para nuevos clientes B2B
   - Considerar marcar como `deprecated: true` en config

3. **`api/b2b/create-token.ts` sin JSDoc**
   - Añadir documentación inline del flujo (validación secret, body schema, response shape)

4. **No hay validación server-side** que rechace `itemName + itemImageUrl` cuando `integrationLevel === 'standard'`
   - Confianza implícita en el e-Commerce. Bajo riesgo, pero bueno cerrarlo.

---

## 6. Pasos Reales para Lanzar (orden ejecución)

```
[Día 1 — Operativa]
  1. Comprar dominio (1h)
  2. Completar legales (medio día — incluye revisión legal si procede)
  3. Reconfigurar OAuth + Webhook (1.5h)

[Día 2 — Validación]
  4. QA en iPhone real con dominio nuevo (2h)
  5. Resolver hallazgos puntuales (estimar buffer 2-4h)

[Día 3 — Operativa B2B]
  6. Practicar runbook de alta manual con 1 tenant ficticio
  7. Preparar templates email bienvenida
  8. Ensayar respuesta a `b2b_activation_requests`

[Día 4 — Lanzamiento blando]
  9. Anuncio interno / círculo cercano
  10. Monitorización 24-48h: logs Vercel, Supabase, Stripe webhooks
  11. Cerrar bugs si aparecen

[Día 5+ — Lanzamiento público]
  12. Anuncio en redes/email
  13. Operativa diaria sobre `b2b_activation_requests`
```

**Tiempo total realista: 5-7 días laborables** (no 1-2 semanas como estimé antes — fui demasiado conservador porque asumí trabajo de QA móvil que en realidad ya está avanzado).

---

## 7. Lo que NO me preocupa

- **Código core** (multiagente, RAG V2, generación, créditos): probado, validado, estable
- **Integración Stripe LIVE**: ya en producción, ya cobra de verdad
- **Auth Supabase email/password**: funcional sin OAuth
- **Mobile UX general**: en iteración activa, los bugs se cazan rápido vía deploy continuo en Vercel

## 8. Lo que sí me preocupa

- **PDF en iOS Safari** — primer punto a verificar en QA día 2 con dominio. Si falla `canShare({files})`, tenemos fallback de descarga directa, pero el UX se degrada.
- **Tiempo de generación** en condiciones reales (4G/5G variable) — un cuento tarda ~60-90s; si la conexión móvil flaquea, el usuario puede pensar que crashea.
- **Onboarding manual B2B** — depende de una persona disponible para responder en horas, no días. Sin esto, las solicitudes se acumulan.

---

## 9. Conclusión

El proyecto NO está bloqueado por código. Está bloqueado por:
1. Compra de un dominio
2. Trabajo administrativo (legales)
3. Configuración de servicios externos (OAuth, Stripe webhook) que dependen del dominio
4. Operativa humana para B2B (no escalable hasta que haya self-serve, que es post-V1)

Tiempo realista hasta tener un cliente B2B pagando: **5-7 días de trabajo concentrado**, asumiendo que los legales no se atascan.
