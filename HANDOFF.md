
# HANDOFF.md — NubeKids Platform

> **Última actualización:** 2026-04-02 (Sesión Fase 10 — Flujo B2B → B2C completo)
> **Estado:** ✅ Fase 10 COMPLETADA — Flujo B2B2C end-to-end funcional
> **Próximo paso:** Fase 11 — Dominio + Deploy + Legal

---

## 🎉 LOGROS DE HOY (02 Abril 2026)

### Fase 10 — Flujo B2B → B2C completo ← HOY

1. ✅ **`src/types.ts`** — Añadidos `B2BSessionParams`, `B2BSession`, `PaymentSource`, `PaymentDecision`
2. ✅ **`src/services/queryParamsService.ts`** — Parser de query params B2B (`?tenant=`, `?item=`, `?item_image=`, `?customer_email=`, `?ref=`)
3. ✅ **`src/services/sessionService.ts`** — `resolvePayment()`: lógica de quién paga el crédito
4. ✅ **`src/utils/itemImageLoader.ts`** — Descarga imagen del producto con 3 fallbacks CORS (fetch → canvas → url-only)
5. ✅ **`src/App.tsx`** — Integración completa: detección `?tenant=`, estado `b2bSession`, nuevos estados `post-story` y `promo-unavailable`, `handleReset` diferenciado B2B vs normal
6. ✅ **`src/components/Setup.tsx`** — Props `initialItemImage`, `initialItemImageUrl`, `initialItemModel` funcionales. Bug corregido: `initialItemModel` ya se aplica a `itemData.description`
7. ✅ **`src/components/wizard/StepItem.tsx`** — Pre-rellenado B2B, badge "Cargado automáticamente", fallback CORS con "Solo vista previa"
8. ✅ **`src/components/PostStoryActions.tsx`** — CTA post-lectura con pricing, botón "Crear otro" → registro B2C
9. ✅ **`src/components/auth/SignUpPage.tsx`** — `initialEmail` pre-rellenado con banner de conversión
10. ✅ **`docs/nubekids_b2b2c_simulator.html`** — Herramienta de testing con 5 escenarios, checklist de Done y log
11. ✅ **Deploy en Vercel exitoso** — TypeScript sin errores, build verde

### Decisiones tomadas en esta sesión
- **`storeName` visible en ambos planes**: Standard y Premium muestran el nombre de la tienda en Step 3
- **Fallback CORS graceful**: si la imagen no se puede convertir a base64, se muestra como preview visual pero no se envía a Gemini — el cuento usa la descripción textual
- **`post-story` como estado separado**: no modifica la state machine existente, `b2bSession.storyGenerated` controla la bifurcación en `handleReset`
- **Test CORS no simulable con URLs públicas**: la mayoría de CDNs modernos envían headers CORS correctos; el fallback se activará con CDNs privados de e-Commerce
- **Integración Premium requiere desarrollo técnico en el e-Commerce**: documentado en `docs/INTEGRACION_PREMIUM.md`

---

## ⚠️ PASOS MANUALES PENDIENTES

### 1. Google OAuth (cuando se tenga dominio)
- Google Cloud Console → OAuth 2.0 Client ID
- Redirect URI: `https://eyirhuxpqaneiehnmguq.supabase.co/auth/v1/callback`
- Supabase Dashboard → Authentication → Providers → Google

### 2. Webhook Stripe en producción
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
| **Sin FK a tenants en credit_accounts** | `tenants.id` es UUID pero `tenant_id` en tokens es TEXT — incompatibilidad de tipos. FK eliminada, integridad por convención |
| **RLS con `tenant_id IS NOT NULL`** | Sesiones anónimas B2B no tienen `auth.uid()`, necesitan leer su saldo sin autenticarse |
| **`.maybeSingle()` en lugar de `.single()`** | PostgREST devuelve 406 con `.single()` cuando no hay filas |
| **Sin React Router** | State machine con estados string — SPA simple sin overhead de router |
| **`consumeCredit()` ANTES de orquestar** | Si falla la generación, el crédito se pierde — aceptable en V1 |
| **Stripe Checkout Sessions (no Elements)** | Hosted checkout: PCI compliance automático, sin UI de pago que construir |
| **Stripe modo LIVE desde el inicio** | Cuenta separada y limpia para NubeKids — sin mezclar con otros SaaS |
| **Precio B2C desde 4.99€** | Ancla de valor: 6x más barato que Wonderbly pero no al nivel de eBook genérico |
| **`b2bSession` separado del flujo principal** | No modifica la state machine existente — objeto independiente que coexiste con `tenantData`/`tokenData` |
| **Fallback CORS en 3 intentos** | fetch → canvas → url-only. Degrada gracefully sin romper el flujo |
| **`post-story` como AppState** | Permite CTA de conversión B2B→B2C sin interferir con el estado `reading` |

---

## 📁 Estructura de Archivos Actual
```
D:\nubekids-tales\
├── .env.local
├── package.json
├── pnpm-lock.yaml
│
├── api/
│   └── stripe/
│       ├── create-checkout.ts
│       └── webhook.ts
│
├── docs/                                    # ✅ NUEVO Fase 10
│   ├── nubekids_b2b2c_simulator.html        # Herramienta de testing B2B2C
│   └── INTEGRACION_PREMIUM.md              # Guía de integración para tenants Premium
│
├── supabase/
│   └── migrations/
│       ├── 001_profiles_and_trigger.sql
│       └── stripe_price_id.sql
│
├── src/
│   ├── App.tsx                              # ✅ b2bSession + post-story + promo-unavailable
│   ├── main.tsx
│   ├── types.ts                             # ✅ B2BSessionParams, B2BSession, PaymentDecision
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
│   │   │   ├── BuyCredits.tsx
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
│   │   └── itemImageLoader.ts              # ✅ NUEVO Fase 10
│   │
│   └── config/
│       └── tenants/
```

---

## 🗄️ Supabase — Tablas Actuales

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `tenants` | Configuración de tenants B2B | ✅ Existente |
| `tokens` | Tokens B2B (TEST123, etc.) | ✅ Existente |
| `rag_chunks` | Chunks RAG con embeddings pgvector | ✅ Existente |
| `profiles` | Extiende auth.users con rol | ✅ Fase 7 |
| `credit_accounts` | Balance de créditos (tenant o user) | ✅ Fase 8 |
| `credit_transactions` | Historial de movimientos | ✅ Fase 8 |
| `credit_packs` | Catálogo de 9 packs con stripe_price_id | ✅ Fase 9 |

**Funciones RPC:**
- `consume_credit(p_tenant_id, p_user_id, p_story_session_id)` → BOOLEAN
- `add_credits(p_tenant_id, p_user_id, p_amount, p_stripe_payment_intent_id)` → INTEGER
- `match_rag_chunks(query_embedding, match_threshold, match_count)` → TABLE

---

## 💳 Stripe — Productos Creados

| Clave interna | Nombre en Stripe | Precio | Price ID |
|---|---|---|---|
| `b2c-trial` | NubeKids · 1 cuento | 4,99 € | `price_1THOLwDcvABCRuSU3NcAhy5B` |
| `b2c-family` | NubeKids · 3 cuentos | 12,99 € | `price_1THOM4DcvABCRuSUQtxVIH2B` |
| `b2c-gift` | NubeKids · 5 cuentos | 19,99 € | `price_1THOMBDcvABCRuSUtGWwVFkC` |
| `b2b-std-starter` | NubeKids · 50 cuentos \| Tiendas | 25,00 € | `price_1THOMJDcvABCRuSUOTLGL2Gp` |
| `b2b-std-growth` | NubeKids · 200 cuentos \| Tiendas | 79,00 € | `price_1THOMQDcvABCRuSUODiMlvBm` |
| `b2b-std-scale` | NubeKids · 500 cuentos \| Tiendas | 159,00 € | `price_1THOMYDcvABCRuSU4p2FmSDu` |
| `b2b-prm-starter` | NubeKids · 50 cuentos \| Premium | 39,00 € | `price_1THOMgDcvABCRuSUCwzqnhLp` |
| `b2b-prm-growth` | NubeKids · 200 cuentos \| Premium | 129,00 € | `price_1THOMpDcvABCRuSUz0DcZvsf` |
| `b2b-prm-scale` | NubeKids · 500 cuentos \| Premium | 259,00 € | `price_1THOMxDcvABCRuSUbbFEijDA` |

---

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
6. **Landing page** — hero, cómo funciona, pricing B2B y B2C, CTA

---

## 📋 Deuda Técnica Conocida

| Item | Prioridad | Estado |
|------|-----------|--------|
| Google OAuth config en GCP + Supabase | Media | ⏳ Cuando haya dominio |
| `consumeCredit` sin refund si falla generación | Media | Aceptable V1 |
| Webhook Stripe apunta a URL Vercel temporal | Media | Actualizar al tener dominio |
| Doble generación mismo usuario anónimo (2 pestañas) | Baja | Aceptable V1 — `consume_credit` es atómico |
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
💳 PAGOS: Stripe end-to-end verificado
🏪 B2B: Funnel completo Standard + Premium funcional
🚀 DEPLOY: Vercel funcionando en push automático

Falta para lanzamiento:
- Dominio propio + configuración DNS
- Legal (GDPR, términos, privacidad)
- Landing page

Estimación hasta lanzamiento: ~1 semana.
```

---

*Fase 10 completada. Funnel B2B2C funcional end-to-end. Listo para Fase 11 — Dominio + Legal. 🚀*