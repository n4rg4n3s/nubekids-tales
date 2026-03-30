# PLANNING.md — NubeKids Platform

> Documento vivo de decisiones arquitectónicas y roadmap.
> Leer al inicio de cada sesión junto con CLAUDE.md, HANDOFF.md y BUSINESS_TECH_SPEC.md.
>
> **Última actualización:** 2026-03-30

---

## Decisiones Arquitectónicas (ADRs)

### ADR-001: Serverless MVP → Google Cloud Run en escala

**Contexto:** Necesitamos desplegar rápido para validar el producto sin inversión en infraestructura.

**Decisión:** MVP en Vercel (frontend + API routes) + Supabase (DB + Auth). Migración a Google Cloud Run cuando el producto valide.

**Razón:**
- Vercel Pro permite 300s de timeout en serverless functions (suficiente para pipeline multiagente).
- Cloud Run es el salto natural: misma lógica en contenedor, sin límites de timeout, proximidad nativa a Gemini API.
- No requiere reescribir — solo empaquetar en contenedor Docker.

**Consecuencias:**
- Diseñar la API como funciones stateless desde el principio.
- No depender de estado en servidor (todo en sesión del navegador o query params).
- Abstraer la capa de IA para que funcione igual en Edge Function y en Cloud Run.

---

### ADR-002: RAG V1 por Tags → V2 pgvector ✅ IMPLEMENTADO

**Contexto:** Necesitamos que el sistema multiagente tenga contexto pedagógico.

**Decisión V1:** Chunks RAG como archivos TypeScript tipados (`.ts`), filtrados por tags en runtime.

**Decisión V2 (IMPLEMENTADA 2026-03-29):** Supabase pgvector + `gemini-embedding-001`.

**Implementación:**
- 3105 chunks ingestados con embeddings de 768 dims
- Búsqueda puramente semántica via RPC `match_rag_chunks`
- Fallback automático a V1 si Supabase falla
- Script de ingesta: `scripts/rag-ingest.mjs`

**Nota:** Los tags en la tabla están vacíos. La búsqueda semántica es suficiente — no se usa `match_rag_chunks_hybrid`. Si en el futuro se quieren tags, hay que actualizar el script de ingesta para asignarlos.

---

### ADR-003: Estado en React (no Redux/Zustand en V1)

**Contexto:** La app V1 maneja estado con React state en App.tsx.

**Decisión:** Mantener React state + useRef para base64 pesados. No añadir state management externo en V1.

**Razón:**
- El estado es relativamente simple: config del tenant, perfil pedagógico, páginas generadas.
- Las imágenes base64 van en refs para evitar re-renders.
- Redux/Zustand añadiría complejidad sin beneficio claro en esta fase.

**Revisión:** Si el estado crece significativamente (dashboard de tenant, historial de cuentos), evaluar Zustand.

---

### ADR-004: Pipeline Multiagente Secuencial

**Contexto:** Podríamos paralelizar algunos agentes para reducir tiempo de generación.

**Decisión:** Ejecución estrictamente secuencial: Orchestrator → RAG → Narrative → Storytelling → Visual Brief.

**Razón:**
- Cada agente depende del output del anterior (el Storytelling necesita el arco del Narrative).
- La calidad pedagógica requiere que el arco narrativo guíe los beats, no al revés.
- La paralelización solo ahorraría tiempo en Visual Brief (que ya es rápido).
- La complejidad de manejar estados parciales y rollbacks no compensa el ahorro.

**Anti-pattern:** NUNCA usar `Promise.all()` para los agentes.

---

### ADR-005: Fotos del niño NO se almacenan en backend

**Contexto:** Privacidad de menores es crítica.

**Decisión:** Las fotos solo existen en memoria de sesión del navegador. Se envían directamente a Gemini API y no pasan por nuestro backend.

**Razón:**
- Cumplimiento de privacidad (GDPR, COPPA).
- Reduce riesgo legal y de seguridad.
- Simplifica arquitectura (no necesitamos storage de imágenes).

**Consecuencia:** No podemos ofrecer "historial de cuentos" con imágenes en V1. Es una feature de V2 que requiere consentimiento explícito.

---

### ADR-006: Objeto Mágico Opcional

**Contexto:** Algunos usuarios querrán crear cuentos sin subir foto del objeto.

**Decisión:** El objeto mágico (foto + descripción) es opcional. Si no se proporciona:
- En tenants B2B con `storeName`: se menciona la tienda en el cuento
- En B2C: la IA inventa un objeto mágico genérico

**Razón:**
- Reduce fricción en el funnel
- Permite uso B2C sin contexto de compra
- La descripción textual es suficiente para la narrativa

---

### ADR-007: Edad del Lector Inferida del Protagonista

**Contexto:** Teníamos selector de Age Group separado y selector de edad del protagonista.

**Decisión:** La edad del lector (AgeGroup) se infiere automáticamente de la edad del protagonista en Step 1.

**Mapeo:**
- 3-4 años → `tiny`
- 5-6 años → `little`
- 7-8 años, 9-10 años → `reader`

---

### ADR-008: react-pageflip para Book.tsx

**Decisión:** Usar `react-pageflip` para efecto de paso de página.

---

### ADR-009: Mock Mode via Variable de Entorno

**Decisión:** `VITE_USE_MOCK=true/false` en `.env.local` controla si se usan datos mock o Gemini real.

---

### ADR-010: RAG V2 Búsqueda Puramente Semántica (sin tags)

**Decisión:** Usar `match_rag_chunks` (búsqueda puramente semántica por similaridad coseno) en lugar de `match_rag_chunks_hybrid`.

**Razón:** La búsqueda semántica es suficientemente precisa para encontrar chunks relevantes. Similarity threshold de 0.3 filtra chunks irrelevantes.

---

### ADR-011: Autenticación con Supabase Auth + Google OAuth ← NUEVO

**Contexto:** Necesitamos cuentas de usuario para cobrar, gestionar créditos y separar tenants de usuarios B2C.

**Decisión:** Supabase Auth con email+password y Google OAuth para todos los roles.

**Implementación:**
- Tabla `profiles` extiende `auth.users` con campo `role` (enum: admin, tenant_owner, tenant_member, b2c_user)
- Trigger `on_auth_user_created` crea perfil automáticamente
- RLS en todas las tablas nuevas
- Sesiones anónimas (sin login) para usuarios que llegan via link de e-Commerce

**Detalle completo:** Ver `BUSINESS_TECH_SPEC.md` § 2.

---

### ADR-012: Sistema de Créditos Prepago (no suscripción) ← NUEVO

**Contexto:** Necesitamos monetizar sin crear fricción. Una suscripción mensual tendría alto churn para un producto de uso esporádico.

**Decisión:** Créditos prepago en packs. 1 crédito = 1 cuento generado.

**Dos canales con pricing diferente:**
- **B2B:** e-Commerce compra packs (50/200/500 cuentos). Dos niveles de precio: Standard y Premium.
- **B2C:** Padre compra packs (1/3/5 cuentos). Precios unitarios más altos (margen mayor).

**Los créditos no caducan.** Se asocian a un `tenant_id` (B2B) o `user_id` (B2C).

**Razón:**
- Cash flow positivo desde día 1 (prepago)
- Simple de implementar (tabla de balance + transacciones)
- No hay lógica de cancelación/prorratas como en suscripciones
- El usuario decide cuándo comprar más

**Detalle completo:** Ver `BUSINESS_TECH_SPEC.md` § 3.

---

### ADR-013: Dos Niveles de Integración B2B (Standard / Premium) ← NUEVO

**Contexto:** Los e-Commerce tienen distintas capacidades técnicas. Unos pueden integrar un widget, otros solo comparten un link.

**Decisión:**

| Plan | Integración | Qué hace | Precio |
|------|-------------|----------|--------|
| **Standard** | Link con `?tenant=xxx` | El nombre de la tienda se teje en la narrativa del cuento. El usuario sube la foto del producto manualmente. | Menor |
| **Premium** | Link con `?tenant=xxx&item=yyy&item_image=zzz` | La foto del producto comprado se inyecta automáticamente en el wizard como "objeto mágico". | Mayor |

**Razón:**
- Standard no requiere integración técnica por parte del e-Commerce (solo compartir un link)
- Premium tiene mayor coste de API (imagen adicional) y mayor valor percibido
- Ambos usan el mismo sistema de créditos, solo cambia el `plan_level` del tenant

**Campo en tenant:** `plan_level: 'standard' | 'premium'`

**V1:** Ambos niveles se implementan con query params (redirect). El widget embebible (iframe/Web Component) es V2.

**Detalle completo:** Ver `BUSINESS_TECH_SPEC.md` § 5.

---

### ADR-014: Stripe Checkout Sessions (no Stripe Elements) ← NUEVO

**Contexto:** Necesitamos cobrar a tenants B2B y usuarios B2C.

**Decisión:** Stripe Checkout Sessions (hosted). No Stripe Elements (embedded).

**Razón:**
- Checkout Sessions maneja toda la UI de pago (no hay que construirla)
- Cumplimiento PCI automático
- Soporta todos los métodos de pago europeos (tarjeta, SEPA, iDEAL, etc.)
- Solo necesitamos: crear session → redirect → webhook

**Flujo:**
1. Frontend llama a `POST /api/stripe/create-checkout` con `packId` + `userId/tenantId`
2. Backend crea Checkout Session en Stripe con metadata
3. Frontend redirige a `session.url` (Stripe hosted)
4. Stripe procesa pago y envía webhook `checkout.session.completed`
5. Backend añade créditos via RPC `add_credits`

**Detalle completo:** Ver `BUSINESS_TECH_SPEC.md` § 4.

---

### ADR-015: Vercel API Routes para Backend V1 ← NUEVO

**Contexto:** Necesitamos endpoints de backend (Stripe webhook, CRUD créditos) pero no queremos montar un servidor separado.

**Decisión:** Vercel Serverless Functions (API Routes) en carpeta `/api/`.

**Razón:**
- Mismo deploy que el frontend (un solo proyecto)
- TypeScript nativo
- Escala automáticamente
- Sin coste adicional en plan Pro

**Estructura:**
```
/api/
  ├── stripe/
  │   ├── create-checkout.ts
  │   └── webhook.ts
  └── v1/
      ├── credits/
      └── sessions/
```

**Variables de entorno del backend** (no VITE_, no se exponen al cliente):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Roadmap de Implementación

### ✅ Fase 1 — Refactor Multitenancy (COMPLETADA)
- [x] Ampliar types.ts con TenantConfig, AgeGroup, PedagogyProfile, AgentBrief
- [x] Crear configs de tenant (shoe-store, fashion-store, direct-b2c)
- [x] Crear tenantLoader.ts con soporte para ?tenant= y ?token=
- [x] Integrar Supabase para validación de tokens
- [x] Añadir campos integrationLevel, storeName, itemLabelSingular

### ✅ Fase 2 — Wizard de Setup (COMPLETADA)
- [x] Crear wizard de 4 pasos
- [x] StepHero con descripción por rasgos o foto
- [x] StepPedagogy con chips + campo "Otro" editable
- [x] StepItem opcional con mención de tienda
- [x] StepStory con edad inferida del Step 1
- [x] Validación por paso
- [x] AppState machine (loading, setup, generating, reading, error)

### ✅ Fase 3 — Sistema Multiagente + RAG V1 (COMPLETADA)
- [x] Crear jsonParser.ts (parseJsonSafely robusto)
- [x] Crear dependencies.ts (contexto de sesión)
- [x] Crear ragService.ts V1 (filtrado por tags)
- [x] Crear chunks RAG iniciales (neuro-dev, child-psych, storytelling)
- [x] Crear storytellingAgent.ts
- [x] Crear narrativeAgent.ts
- [x] Crear visualBriefAgent.ts
- [x] Crear orchestratorAgent.ts
- [x] Integrar pipeline en App.tsx
- [x] Testing end-to-end

### ✅ Fase 4 — Generación de Imágenes + Book (COMPLETADA)
- [x] imageGenerationService.ts con Gemini
- [x] Book.tsx con react-pageflip y colores tenant
- [x] Ratio: libro 16:9, imágenes 4:5
- [x] Export PDF con jsPDF (pdfExport.ts)
- [x] Mock mode con VITE_USE_MOCK

### ✅ Fase 5 — RAG V2 con pgvector (COMPLETADA)
- [x] Convertir PDFs a markdown (10 de 14 usables)
- [x] Crear schema SQL en Supabase (tabla rag_chunks + funciones RPC)
- [x] Crear script de ingesta (scripts/rag-ingest.mjs)
- [x] Chunkear markdown (~500 tokens/chunk)
- [x] Generar embeddings con gemini-embedding-001 (768 dims)
- [x] Ingestar 3105 chunks en Supabase
- [x] Reescribir ragService.ts para búsqueda semántica
- [x] Fallback automático a V1 si Supabase falla
- [x] Testing end-to-end (cuento real con RAG semántico)

### ⏳ Fase 6 — Bugfix + Estabilización (PENDIENTE — PRÓXIMA)
- [ ] **FIX CRÍTICO:** Bug de imágenes vacías (regresión del RAG V2)
- [ ] FIX: Book container demasiado pequeño
- [ ] FIX: PDF orientación landscape (no portrait)
- [ ] Crear `src/lib/supabase.ts` (cliente singleton, fix warning "Multiple GoTrueClient")
- [ ] Limpiar logs debug de ragService.ts
- [ ] FIX: Warning React en StepHero (setState durante render)
- [ ] Commit RAG V2 a GitHub
- [ ] **Referencia:** `BUSINESS_TECH_SPEC.md` § 11 para diagnóstico del bug de imágenes

### ⏳ Fase 7 — Autenticación (PENDIENTE)
- [ ] Crear tablas SQL: `profiles`, tipo enum `user_role`
- [ ] Crear trigger `on_auth_user_created`
- [ ] Configurar Google OAuth en Supabase Dashboard
- [ ] Crear `src/lib/supabase.ts` (si no existe ya de Fase 6)
- [ ] Crear `src/services/authService.ts`
- [ ] Crear `src/hooks/useAuth.ts`
- [ ] Crear componentes: `LoginPage.tsx`, `SignUpPage.tsx`, `AuthCallback.tsx`
- [ ] Crear `ProtectedRoute.tsx` (wrapper)
- [ ] Implementar lógica: wizard sin login si viene de tenant B2B, requiere login si es B2C directo
- [ ] Configurar RLS policies en todas las tablas
- [ ] **Referencia:** `BUSINESS_TECH_SPEC.md` § 2

### ⏳ Fase 8 — Sistema de Créditos (PENDIENTE)
- [ ] Crear tablas SQL: `credit_accounts`, `credit_transactions`, `credit_packs`
- [ ] Crear funciones RPC: `consume_credit()`, `add_credits()`
- [ ] Insertar catálogo de packs (B2B Standard, B2B Premium, B2C)
- [ ] Crear `src/services/creditService.ts`
- [ ] Crear `src/hooks/useCredits.ts`
- [ ] Crear `src/components/credits/CreditBalance.tsx` (badge en header)
- [ ] Crear `src/components/credits/NoCreditsBanner.tsx`
- [ ] Integrar en App.tsx: `consumeCredit()` ANTES de iniciar generación
- [ ] Crear `src/services/sessionService.ts` (resolvePayment: quién paga)
- [ ] Crear tabla `story_sessions` para tracking
- [ ] **Referencia:** `BUSINESS_TECH_SPEC.md` § 3 y § 6

### ⏳ Fase 9 — Stripe + Compra de Créditos (PENDIENTE)
- [ ] Crear productos y prices en Stripe Dashboard (test mode primero)
- [ ] Actualizar `credit_packs` con `stripe_price_id`
- [ ] Crear `api/stripe/create-checkout.ts` (Vercel serverless function)
- [ ] Crear `api/stripe/webhook.ts` (Vercel serverless function)
- [ ] Crear `src/services/stripeService.ts` (frontend: redirect a checkout)
- [ ] Crear `src/components/credits/BuyCredits.tsx` (pantalla de compra)
- [ ] Probar flujo completo con Stripe test mode
- [ ] Probar webhook local con `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] **Referencia:** `BUSINESS_TECH_SPEC.md` § 4

### ⏳ Fase 10 — Flujo B2B → B2C Completo (PENDIENTE)
- [ ] Implementar carga de `item_image` desde URL (`src/utils/itemImageLoader.ts`)
- [ ] Ampliar query params soportados: `?tenant=&item=&item_image=&customer_email=`
- [ ] Implementar lógica de sesión anónima (1er cuento gratis via tenant)
- [ ] Implementar flujo "crear otro cuento" → redirect a registro B2C
- [ ] Pre-rellenar email en registro si viene en query param
- [ ] Probar flujo completo: link B2B → cuento gratis → registro B2C → compra créditos
- [ ] Crear documentación de integración para tenants (cómo generar el link)
- [ ] **Referencia:** `BUSINESS_TECH_SPEC.md` § 5 y § 6

### ⏳ Fase 11 — Dominio + Deploy + Legal (PENDIENTE)
- [ ] Comprar dominio
- [ ] Deploy frontend + API en Vercel
- [ ] Configurar DNS
- [ ] Configurar Stripe webhook con URL de producción
- [ ] Activar Stripe live mode
- [ ] Crear política de privacidad (GDPR, datos de menores)
- [ ] Crear términos de servicio
- [ ] Crear aviso legal
- [ ] Crear política de cookies
- [ ] Landing page mínima (hero, cómo funciona, pricing, CTA)
- [ ] **Referencia:** `BUSINESS_TECH_SPEC.md` § 10

### ⏳ Fase 12 — Dashboard de Tenant (POST-LANZAMIENTO)
- [ ] `TenantDashboard.tsx` (balance de créditos, métricas básicas, comprar más)
- [ ] `BrandingEditor.tsx` (colores, logo, prompt base editable)
- [ ] `UsageStats.tsx` (cuentos generados, por día/semana)
- [ ] Onboarding de nuevo tenant (formulario de registro + primer pack)
- [ ] Generación del link personalizado para el tenant

### 🔮 Fase 13 — Widget Embebible (FUTURO V2)
- [ ] Web Component `<nubekids-upsell>` embebible en checkouts
- [ ] iframe sandboxed como alternativa
- [ ] API REST: `POST /api/v1/webhooks/shopify` y `/woocommerce`
- [ ] Email transaccional con Resend (link de sesión al comprador)

### 🔮 Fase 14 — Mejoras Futuras (BACKLOG)
- [ ] Narración en audio (Text-to-Speech)
- [ ] Guardado en nube de cuentos generados
- [ ] Impresión bajo demanda
- [ ] Vertical educativa (colegios)
- [ ] Analytics avanzados de impacto pedagógico
- [ ] Agente Editor/Crítico en pipeline

---

## Deuda Técnica Conocida

| Item | Prioridad | Estado | Fase |
|------|-----------|--------|------|
| **Bug: imágenes vacías tras RAG V2** | CRÍTICA | Pendiente | 6 |
| Book container demasiado pequeño | Alta | Pendiente | 6 |
| PDF orientación vertical (debe ser landscape) | Alta | Pendiente | 6 |
| Warning "Multiple GoTrueClient" Supabase | Alta | Pendiente | 6 |
| Logs DEBUG en ragService.ts | Media | Pendiente | 6 |
| Warning React en StepHero (setState durante render) | Baja | Pendiente | 6 |
| No hay tests unitarios | Alta | Pendiente | - |
| Imágenes genéricas (sin foto real del héroe) | Media | Pendiente | - |
| OCR para 4 PDFs de solo imágenes | Media | Pendiente | - |
| Protección navegación (beforeunload) | Baja | Pendiente | - |
| Tags vacíos en rag_chunks | Baja | Semántica pura OK | - |

---

## Dependencias Externas

| Servicio | Uso | Estado |
|----------|-----|--------|
| Supabase | Auth + DB + RAG V2 pgvector | ✅ Integrado (ampliar con Auth) |
| Gemini API | Texto + Imagen + Embeddings | ✅ Integrado |
| Stripe | Pagos (créditos B2B y B2C) | ⏳ Cuenta creada, pendiente config |
| Vercel | Deploy frontend + API routes | ⏳ Pendiente |
| Dominio | nubekids.io / nubekidstales.com | ⏳ Pendiente de compra |
| Resend | Email transaccional (V2) | 🔮 Futuro |

---

## Métricas de Éxito

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| Wizard completion rate | > 70% | Sin tracking aún |
| Time to first page | < 8 segundos | Sin tracking aún |
| Stories completed / initiated | > 60% | Sin tracking aún |
| PDF downloads / completed | > 80% | Sin tracking aún |
| RAG search latency | < 2 segundos | ✅ Actual: ~1.3s |
| B2B upsell conversion | > 8% | Sin tracking aún |
| B2C credit purchase rate | > 15% de registrados | Sin tracking aún |
| Coste medio por cuento | < 0.30€ | Estimado: 0.15-0.30€ |

---

## Documentos de Referencia

| Documento | Propósito |
|-----------|-----------|
| `CLAUDE.md` | Reglas del proyecto para Claude |
| `PLANNING.md` | Este documento — ADRs, roadmap |
| `HANDOFF.md` | Estado actual, bugs, estructura de archivos |
| `BUSINESS_TECH_SPEC.md` | **NUEVO** — Auth, créditos, Stripe, integración B2B, pseudocódigo |
| `docs/GUIA_RAG_V2.md` | Guía técnica RAG V2 |
| `nubekids_PRD_v2.md` | Requisitos de producto (visión original) |
| `nubekids_PRP_v2.md` | Prompt de implementación (arquitectura original) |
| `nubekids_DD_Design_Document.md` | Guía de diseño UI/UX |