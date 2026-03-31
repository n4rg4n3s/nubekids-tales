# HANDOFF.md — NubeKids Platform

> **Última actualización:** 2026-03-31 (Sesión Fase 8 — Sistema de Créditos)
> **Estado:** ✅ Fase 8 COMPLETADA — Sistema de créditos prepago funcional
> **Próximo paso:** Fase 9 — Stripe + Compra de Créditos

---

## 🎉 LOGROS DE HOY (31 Marzo 2026)

### Fase 7 — Autenticación (completada en sesión anterior)
1. ✅ `authService.ts` — Sign up, sign in (email + Google), sign out, profile fetch
2. ✅ `useAuth.ts` — Hook React con estado de auth reactivo + session listener
3. ✅ `AuthContext.tsx` — Context provider envolviendo toda la app
4. ✅ `LoginPage.tsx` — Formulario login (email + botón Google OAuth)
5. ✅ `SignUpPage.tsx` — Formulario registro con pantalla de confirmación
6. ✅ `AuthCallback.tsx` — Loading screen para redirect de OAuth
7. ✅ `001_profiles_and_trigger.sql` — Tabla `profiles`, RLS y trigger auto-creación
8. ✅ `types.ts` — `UserRole` + `UserProfile` añadidos
9. ✅ `App.tsx` — Estado `'auth'`, auth gating, bypass B2B, callback OAuth, user menu
10. ✅ `main.tsx` — `<App />` envuelto con `<AuthProvider>`

### Fase 8 — Sistema de Créditos ← HOY
1. ✅ **SQL ejecutado en Supabase** — 3 tablas + 2 funciones RPC + catálogo de packs
2. ✅ **`creditService.ts` creado** — `getBalance()`, `consumeCredit()`, `getCreditPacks()`
3. ✅ **`useCredits.ts` creado** — Hook con balance reactivo + refresh
4. ✅ **`CreditBalance.tsx` creado** — Badge `✨ N cuentos` en header
5. ✅ **`NoCreditsBanner.tsx` creado** — Pantalla sin créditos con CTA
6. ✅ **`App.tsx` actualizado** — `consumeCredit()` antes de generar + estado `'no-credits'`
7. ✅ **Bugs resueltos:**
   - `auth.loading` infinito → fix en `useAuth.ts` (llamadas independientes con `.catch`)
   - 406 en `credit_accounts` → `.single()` → `.maybeSingle()`
   - RLS bloqueaba lectura de tenant → nueva policy `USING (tenant_id IS NOT NULL)`
   - 2 filas duplicadas en `credit_accounts` → limpieza SQL
8. ✅ **Book.tsx mejorado** — Borde imagen suavizado (1px), libro centrado verticalmente
9. ✅ **pdfExport.ts mejorado** — Emojis sustituidos por `*   *   *` (compatibilidad jsPDF)

### Smoke test Fase 8 ✅
- Badge muestra `✨ 10 cuentos` con `?token=TEST123`
- Al generar un cuento → descuenta 1 crédito correctamente
- Con balance 0 → aparece `NoCreditsBanner`

---

## ⚠️ PASOS MANUALES PENDIENTES (Fase 7 — sin bloquear desarrollo)

### 1. SQL migration profiles (si no se ejecutó aún)
`supabase/migrations/001_profiles_and_trigger.sql` → Supabase Dashboard → SQL Editor

### 2. Google OAuth (cuando se tenga dominio)
- Google Cloud Console → OAuth 2.0 Client ID
- Redirect URI: `https://eyirhuxpqaneiehnmguq.supabase.co/auth/v1/callback`
- Supabase Dashboard → Authentication → Providers → Google

### 3. Smoke test auth email/password
- Crear cuenta con email/password en local
- Verificar bypass con `?token=TEST123`

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
| Fase 8 — Sistema de Créditos | ✅ **COMPLETA** | **Prepago funcional end-to-end** ← HOY |
| Fase 9 — Stripe | ⏳ Diseñada | Cuenta existe, falta config |
| Fase 10 — Flujo B2B → B2C | ⏳ Diseñada | Query params + sessionService |
| Fase 11 — Deploy | ⏳ Pendiente | Dominio + Vercel + legal |
| Fase 12 — Dashboard Tenant | 🔮 Futuro | Post-lanzamiento |

---

## 📐 Decisiones de Arquitectura

| Decisión | Razón |
|----------|-------|
| **Sin FK a tenants en credit_accounts** | `tenants.id` es UUID pero `tenant_id` en tokens es TEXT — incompatibilidad de tipos. FK eliminada, integridad por convención |
| **RLS con `tenant_id IS NOT NULL`** | Sesiones anónimas B2B no tienen `auth.uid()`, necesitan leer su saldo sin autenticarse |
| **`.maybeSingle()` en lugar de `.single()`** | PostgREST devuelve 406 con `.single()` cuando no hay filas — `.maybeSingle()` devuelve null silenciosamente |
| **Sin React Router** | State machine con estados `'auth'`, `'auth-callback'`, `'no-credits'` — SPA simple |
| **`consumeCredit()` ANTES de orquestar** | Si falla la generación después de consumir, el crédito se pierde — aceptable en V1, mejorable con refund en V2 |

---

## 📁 Estructura de Archivos Actual

```
D:\nubekids-tales\
├── .env.local
├── package.json
│
├── supabase/
│   └── migrations/
│       └── 001_profiles_and_trigger.sql     # Fase 7
│
├── src/
│   ├── App.tsx                              # ✅ Estado 'no-credits' + consumeCredit
│   ├── main.tsx                             # Envuelto con <AuthProvider>
│   ├── types.ts                             # UserRole + UserProfile
│   │
│   ├── lib/
│   │   └── supabase.ts                      # Cliente singleton
│   │
│   ├── context/
│   │   └── AuthContext.tsx                  # Fase 7
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                       # ✅ Fix loading infinito
│   │   └── useCredits.ts                    # ✅ NUEVO Fase 8
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx                # Fase 7
│   │   │   ├── SignUpPage.tsx               # Fase 7
│   │   │   └── AuthCallback.tsx             # Fase 7
│   │   ├── credits/                         # ✅ NUEVO Fase 8
│   │   │   ├── CreditBalance.tsx
│   │   │   └── NoCreditsBanner.tsx
│   │   ├── Book.tsx                         # ✅ Borde imagen + centrado
│   │   ├── Setup.tsx
│   │   └── wizard/
│   │       ├── StepHero.tsx
│   │       ├── StepPedagogy.tsx
│   │       ├── StepItem.tsx
│   │       └── StepStory.tsx
│   │
│   ├── services/
│   │   ├── authService.ts                   # Fase 7
│   │   ├── creditService.ts                 # ✅ NUEVO Fase 8
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
│   │   ├── pdfExport.ts                     # ✅ Fix emojis PDF
│   │   └── jsonParser.ts
│   │
│   └── config/
│       └── tenants/                         # 3 verticales
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
| `credit_packs` | Catálogo de packs (9 packs) | ✅ Fase 8 |

**Funciones RPC:**
- `consume_credit(p_tenant_id, p_user_id, p_story_session_id)` → BOOLEAN
- `add_credits(p_tenant_id, p_user_id, p_amount, p_stripe_payment_intent_id)` → INTEGER
- `match_rag_chunks(query_embedding, match_threshold, match_count)` → TABLE

---

## 🔧 Variables de Entorno

```env
# .env.local (ACTUALES)
VITE_SUPABASE_URL=https://eyirhuxpqaneiehnmguq.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_GEMINI_API_KEY=xxx
VITE_USE_MOCK=true

# NUEVAS — añadir para Fase 9
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# BACKEND Vercel (NO VITE_) — Fase 9
# STRIPE_SECRET_KEY=sk_test_xxx
# STRIPE_WEBHOOK_SECRET=whsec_xxx
# SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## 🔌 Dependencias Clave

| Paquete | Versión | Uso | Estado |
|---------|---------|-----|--------|
| `@google/genai` | ^1.46.0 | Gemini texto + imagen + embeddings | ✅ |
| `@supabase/supabase-js` | latest | Auth + RAG + créditos | ✅ |
| `react-pageflip` | ^2.0.3 | Book page-flip | ✅ |
| `jspdf` | ^2.x | Export PDF | ✅ |
| `stripe` | latest | Backend checkout sessions | ⏳ Fase 9 |
| `@stripe/stripe-js` | latest | Frontend redirect checkout | ⏳ Fase 9 |

---

## 🚀 Próximos Pasos

### Inmediato
1. **Commit a GitHub** — Fases 7 + 8
   - `git add . && git commit -m "feat: Fases 7-8 completas - Auth + Sistema de Créditos"`

2. **Antes del deploy en Vercel — limpiar errores TypeScript:**
   - Variables no usadas en `App.tsx` (`agentBrief`, `orchestratorTiming`, `apiKey`)
   - `heroAge` → verificar nombre correcto en `SetupData`
   - `null` → `undefined` en `mockAgentBrief.ts`
   - `response.embeddings ?? []` en `ragService.ts`
   - `RagChunk` import en `deactive_neuro-dev.chunks.ts`

### Fase 9 — Stripe (Próxima sesión)
3. Crear productos en Stripe Dashboard (test mode)
4. Actualizar `credit_packs` con `stripe_price_id`
5. Crear `api/stripe/create-checkout.ts` (Vercel serverless)
6. Crear `api/stripe/webhook.ts` — llama a `add_credits()` RPC
7. Crear `src/services/stripeService.ts`
8. Crear `src/components/credits/BuyCredits.tsx`
9. **Referencia:** `BUSINESS_TECH_SPEC.md` § 4

### Fase 10 — Flujo B2B → B2C
10. `src/utils/itemImageLoader.ts` — cargar `item_image` desde URL
11. Ampliar query params: `?tenant=&item=&item_image=&customer_email=`
12. Flujo "crear otro cuento" → registro B2C

---

## 📋 Deuda Técnica Conocida

| Item | Prioridad | Estado |
|------|-----------|--------|
| Errores TypeScript para build Vercel | **ALTA** | ⏳ Pendiente — bloquea deploy |
| Smoke test auth email/password | Alta | ⏳ Pendiente manual |
| SQL migration profiles ejecutada | Alta | ⏳ Pendiente manual |
| Google OAuth config en GCP + Supabase | Media | ⏳ Cuando haya dominio |
| `consumeCredit` sin refund si falla generación | Media | Aceptable V1 |
| Violations react-pageflip touchstart | Baja | Ignorable (librería externa) |
| No hay tests unitarios | Alta | Pendiente |
| OCR para 4 PDFs de solo imágenes | Media | Pendiente |

---

## 🏆 GitHub

**Repo:** https://github.com/jav13rrez/nubekids-tales.git

**Pendiente de commit (Fases 7 + 8):**
- Auth completa (7 archivos nuevos)
- Sistema de créditos (4 archivos nuevos)
- Fixes: `useAuth.ts`, `creditService.ts`, `Book.tsx`, `pdfExport.ts`, `App.tsx`

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
✅ Fase 8: Sistema de Créditos — COMPLETADA ← HOY
📐 Fase 9-11: DISEÑADAS en BUSINESS_TECH_SPEC.md

🎯 ESTADO: MVP CON AUTH + CRÉDITOS FUNCIONAL
💳 CRÉDITOS: Prepago end-to-end (consumo verificado, balance en badge)
⚠️ BLOQUEANTE DEPLOY: Errores TypeScript pendientes de limpiar

Falta implementar:
- Stripe (compra de créditos)
- Flujo B2B → B2C completo
- Deploy + dominio + legal

Estimación hasta lanzamiento: ~2-3 semanas de desarrollo.
```

---

*Fase 8 completada. Sistema de créditos prepago funcional. Listo para Fase 9 — Stripe. 🚀*