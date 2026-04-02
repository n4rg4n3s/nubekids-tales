# HANDOFF.md — NubeKids Platform

> **Última actualización:** 2026-04-01 (Sesión Fase 9 — Stripe + Compra de Créditos)
> **Estado:** ✅ Fase 9 COMPLETADA — Flujo de pago end-to-end funcional
> **Próximo paso:** Fase 10 — Flujo B2B → B2C completo

---

## 🎉 LOGROS DE HOY (01 Abril 2026)

### Fase 9 — Stripe + Compra de Créditos ← HOY

1. ✅ **9 productos creados en Stripe** (cuenta acct_1CvoJ4DcvABCRuSU / Narganes)
   - 3 packs B2C: NubeKids · 1/3/5 cuentos (4.99€ / 12.99€ / 19.99€)
   - 3 packs B2B Standard: NubeKids · 50/200/500 cuentos | Tiendas
   - 3 packs B2B Premium: NubeKids · 50/200/500 cuentos | Premium
   - Copy en español, descripciones orientadas al valor emocional/pedagógico
2. ✅ **`credit_packs` actualizada** — `stripe_price_id` + `price_cents` corregidos
3. ✅ **`api/stripe/create-checkout.ts`** — Vercel serverless function
4. ✅ **`api/stripe/webhook.ts`** — Añade créditos via RPC tras `checkout.session.completed`
5. ✅ **`src/services/stripeService.ts`** — `redirectToCheckout()` desde frontend
6. ✅ **`src/components/credits/BuyCredits.tsx`** — Pantalla de compra con design system NubeKids
7. ✅ **`src/components/credits/CreditsSuccess.tsx`** — Confirmación post-pago
8. ✅ **`App.tsx` actualizado** — Estados `'no-credits'` y `'credits-success'` integrados
9. ✅ **Variables de entorno** configuradas en `.env.local` y Vercel Dashboard
10. ✅ **Test end-to-end con Stripe CLI** — Webhook verificado, créditos añadidos correctamente
11. ✅ **Deploy en Vercel exitoso** — Fix pnpm-lock.yaml + fix rutas TypeScript

### Decisiones tomadas en esta sesión
- **Pricing B2C subido**: 2.99/6.99/9.99€ → 4.99/12.99/19.99€ (ancla de valor más coherente)
- **Naming sin Starter/Growth/Scale**: productos nombrados por cantidad de cuentos
- **Cuenta Stripe separada para NubeKids**: acct_1CvoJ4DcvABCRuSU (vacía, solo NubeKids)
- **Modo LIVE desde el inicio**: productos creados directamente en producción

---

## ⚠️ PASOS MANUALES PENDIENTES

### 1. Google OAuth (cuando se tenga dominio)
- Google Cloud Console → OAuth 2.0 Client ID
- Redirect URI: `https://eyirhuxpqaneiehnmguq.supabase.co/auth/v1/callback`
- Supabase Dashboard → Authentication → Providers → Google

### 2. Webhook Stripe en producción
- El webhook configurado apunta a la URL de Vercel actual
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
| Fase 9 — Stripe | ✅ **COMPLETA** | **Pago end-to-end verificado** ← HOY |
| Fase 10 — Flujo B2B → B2C | ⏳ Pendiente | Query params + sessionService |
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

---

## 📁 Estructura de Archivos Actual
```
D:\nubekids-tales\
├── .env.local
├── package.json
├── pnpm-lock.yaml                           # ✅ Sincronizado con pnpm
│
├── api/                                     # ✅ NUEVO Fase 9 — Vercel serverless
│   └── stripe/
│       ├── create-checkout.ts
│       └── webhook.ts
│
├── supabase/
│   └── migrations/
│       ├── 001_profiles_and_trigger.sql     # Fase 7
│       └── stripe_price_id.sql              # ✅ NUEVO Fase 9
│
├── src/
│   ├── App.tsx                              # ✅ Estados no-credits + credits-success
│   ├── main.tsx
│   ├── types.ts
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
│   │   │   ├── SignUpPage.tsx
│   │   │   └── AuthCallback.tsx
│   │   ├── credits/
│   │   │   ├── CreditBalance.tsx
│   │   │   ├── NoCreditsBanner.tsx
│   │   │   ├── BuyCredits.tsx               # ✅ NUEVO Fase 9
│   │   │   └── CreditsSuccess.tsx           # ✅ NUEVO Fase 9
│   │   ├── Book.tsx
│   │   ├── Setup.tsx
│   │   └── wizard/
│   │       ├── StepHero.tsx
│   │       ├── StepPedagogy.tsx
│   │       ├── StepItem.tsx
│   │       └── StepStory.tsx
│   │
│   ├── services/
│   │   ├── authService.ts
│   │   ├── creditService.ts
│   │   ├── stripeService.ts                 # ✅ NUEVO Fase 9
│   │   ├── imageGenerationService.ts
│   │   ├── dependencies.ts
│   │   ├── ragService.ts
│   │   ├── tokenService.ts
│   │   └── agents/
│   │       ├── orchestratorAgent.ts
│   │       ├── narrativeAgent.ts
│   │       ├── storytellingAgent.ts
│   │       └── visualBriefAgent.ts
│   │
│   ├── utils/
│   │   ├── pdfExport.ts
│   │   └── jsonParser.ts
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
STRIPE_WEBHOOK_SECRET=whsec_xxx   # ← usar whsec de CLI en local, de Dashboard en prod
SUPABASE_URL=https://eyirhuxpqaneiehnmguq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
FRONTEND_URL=http://localhost:5173  # ← URL de Vercel en producción
```

> Todas las variables sin `VITE_` están también configuradas en Vercel Dashboard → Settings → Environment Variables.

---

## 🔌 Dependencias Clave

| Paquete | Versión | Uso | Estado |
|---------|---------|-----|--------|
| `@google/genai` | ^1.46.0 | Gemini texto + imagen + embeddings | ✅ |
| `@supabase/supabase-js` | latest | Auth + RAG + créditos | ✅ |
| `react-pageflip` | ^2.0.3 | Book page-flip | ✅ |
| `jspdf` | ^2.x | Export PDF | ✅ |
| `stripe` | ^21.0.1 | Backend checkout sessions + webhook | ✅ Fase 9 |
| `@vercel/node` | ^5.6.23 | Tipos para serverless functions | ✅ Fase 9 |

---

## 🚀 Próximos Pasos — Fase 10

Según `BUSINESS_TECH_SPEC.md` § 5 y § 6:

1. **`src/utils/itemImageLoader.ts`** — Cargar `item_image` desde URL (Plan Premium B2B)
2. **Ampliar query params soportados:**
   `?tenant=xxx&item=nombre+producto&item_image=https://...&customer_email=padre@email.com`
3. **Lógica de sesión anónima** — 1er cuento gratis via tenant, sin login
4. **Flujo "crear otro cuento"** → CTA post-lectura → registro B2C → compra créditos
5. **Pre-rellenar email** en registro si viene en query param

---

## 📋 Deuda Técnica Conocida

| Item | Prioridad | Estado |
|------|-----------|--------|
| Google OAuth config en GCP + Supabase | Media | ⏳ Cuando haya dominio |
| `consumeCredit` sin refund si falla generación | Media | Aceptable V1 |
| Webhook Stripe apunta a URL Vercel temporal | Media | Actualizar al tener dominio |
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
✅ Fase 1: Multitenancy — COMPLETADA
✅ Fase 2: Wizard Setup — COMPLETADA
✅ Fase 3: Sistema Multiagente + RAG V1 — COMPLETADA
✅ Fase 4: Generación imágenes + Book — COMPLETADA
✅ Fase 5: RAG V2 pgvector — COMPLETADA
✅ Fase 6: Bugfix + Estabilización — COMPLETADA
✅ Fase 7: Autenticación (Supabase Auth + OAuth) — COMPLETADA
✅ Fase 8: Sistema de Créditos — COMPLETADA
✅ Fase 9: Stripe + Compra de Créditos — COMPLETADA ← HOY
⏳ Fase 10: Flujo B2B → B2C completo — SIGUIENTE
⏳ Fase 11: Deploy + Dominio + Legal — Vercel ✅, falta dominio + legal

🎯 ESTADO: MVP COMERCIAL — Auth + Créditos + Pagos FUNCIONAL
💳 PAGOS: Stripe end-to-end verificado con CLI (webhook → add_credits ✅)
🚀 DEPLOY: Vercel funcionando en push automático

Falta implementar:
- Flujo B2B → B2C completo (query params + sesión anónima)
- Dominio propio + legal (GDPR, términos, privacidad)

Estimación hasta lanzamiento: ~1-2 semanas de desarrollo.
```

---

*Fase 9 completada. MVP con pagos reales funcional. Listo para Fase 10 — Flujo B2B → B2C. 🚀*