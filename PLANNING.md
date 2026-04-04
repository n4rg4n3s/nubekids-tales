# PLANNING.md — NubeKids Platform

> Documento vivo de decisiones arquitectónicas y roadmap.
> Leer al inicio de cada sesión junto con HANDOFF.md y BUSINESS_TECH_SPEC.md.
>
> **Última actualización:** 2026-04-04

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

### ADR-011: Autenticación con Supabase Auth + Google OAuth ✅ IMPLEMENTADO

**Contexto:** Necesitamos cuentas de usuario para cobrar, gestionar créditos y separar tenants de usuarios B2C.

**Decisión:** Supabase Auth con email+password y Google OAuth para todos los roles.

**Implementación:**
- Tabla `profiles` extiende `auth.users` con campo `role` (enum: admin, tenant_owner, tenant_member, b2c_user)
- Trigger `on_auth_user_created` crea perfil automáticamente
- RLS en todas las tablas nuevas
- Sesiones anónimas (sin login) para usuarios que llegan via link de e-Commerce

**Detalle completo:** Ver `BUSINESS_TECH_SPEC.md` § 2.

---

### ADR-012: Sistema de Créditos Prepago (no suscripción) ✅ IMPLEMENTADO

**Contexto:** Necesitamos monetizar sin crear fricción. Una suscripción mensual tendría alto churn para un producto de uso esporádico.

**Decisión:** Créditos prepago en packs. 1 crédito = 1 cuento generado.

**Dos canales con pricing diferente:**
- **B2B:** e-Commerce compra packs (50/200/500 cuentos). Dos niveles de precio: Standard y Premium.
- **B2C:** Padre compra packs (1/3/5 cuentos). Precios unitarios más altos (margen mayor).

**Los créditos no caducan.** Se asocian a un `tenant_id` (B2B) o `user_id` (B2C).

**Detalle completo:** Ver `BUSINESS_TECH_SPEC.md` § 3.

---

### ADR-013: Dos Niveles de Integración B2B (Standard / Premium) ✅ IMPLEMENTADO

**Contexto:** Los e-Commerce tienen distintas capacidades técnicas.

**Decisión:**

| Plan | Integración | Qué incluye el cuento | Precio |
|------|-------------|----------------------|--------|
| **Standard** | Link con `?tenant=xxx` | **Guión narrativo** menciona el nombre de tu tienda | Menor |
| **Premium** | Link con `?tenant=xxx&item=yyy&item_image=zzz` | Guión + **ilustraciones**: el niño lleva puesto el producto comprado en tu tienda en cada imagen | Mayor |

**V1:** Ambos niveles con query params. Widget embebible (iframe/Web Component) es V2.

**Detalle completo:** Ver `BUSINESS_TECH_SPEC.md` § 5.

---

### ADR-014: Stripe Checkout Sessions (no Stripe Elements) ✅ IMPLEMENTADO

**Decisión:** Stripe Checkout Sessions (hosted). No Stripe Elements (embedded).

**Razón:** Checkout Sessions maneja toda la UI de pago. Cumplimiento PCI automático. Soporta todos los métodos de pago europeos.

**Detalle completo:** Ver `BUSINESS_TECH_SPEC.md` § 4.

---

### ADR-015: Vercel API Routes para Backend V1 ✅ IMPLEMENTADO

**Decisión:** Vercel Serverless Functions (API Routes) en carpeta `/api/`.

**Estructura:**
```
/api/
  └── stripe/
      ├── create-checkout.ts
      └── webhook.ts
```

---

### ADR-016: Landings Estáticas en `/public` (sin React) ✅ IMPLEMENTADO

**Contexto:** Necesitamos páginas de marketing (B2B y B2C) independientes del SPA.

**Decisión:** HTML estático con CSS vanilla en `/public/b2b.html` y `/public/b2c.html`.

**Razón:**
- Carga instantánea — sin bundle de React
- SEO friendly (HTML semántico directo)
- Sirven automáticamente desde Vercel sin build step
- Independientes del estado de la app — no se rompen si el SPA tiene errores
- Modificables sin tocar TypeScript

**Convenciones de copy:**
- **Sin mencionar "IA" en ningún punto de contacto con usuario final** — genera desconfianza en padres. Sustituir siempre por: "motor narrativo", "cuentos personalizados", "calibrado por edad y perfil del niño".
- CTAs apuntan a `/buy-credits` (→ `BuyCredits.tsx`)
- Sin la palabra "gratis" en CTAs — reencuadre de valor como inversión de negocio

**Design system aplicado:** `nubekids_DD_Design_Document.md`
- Fonts: Fredoka One (display) + Nunito (body) vía Google Fonts
- Paleta: cream `#FDFBF7` / purple `#8B5CF6` / yellow `#FBBF24` / sky `#38BDF8` / mint `#34D399` / ink `#1E293B`
- Tactile buttons: `border: 3px solid #1E293B`, `box-shadow: 4px 4px 0px #1E293B`, hover translate 2px

---

### ADR-017: `itemInteractionMode` desacoplado de `tenant` ✅ IMPLEMENTADO

**Contexto:** El sistema estaba usando `shoe-store` y `fashion-store` como si fueran categorías narrativas, cuando en realidad la diferencia importante era cómo el niño se relaciona con el producto.

**Decisión:** Mantener `tenant` como identidad comercial/branding y mover la semántica narrativa/visual del objeto a `itemInteractionMode`.

**Asignación actual:**
- `shoe-store-default` → `wearable`
- `fashion-store-default` → `wearable`
- `direct-b2c` → `generic`

**Razón:**
- preserva compatibilidad con URLs ya existentes
- evita seguir creando tenants “falsos” para resolver comportamiento del objeto
- prepara el sistema para nuevos modos como `interactive` sin romper arquitectura

**Consecuencia:**
- `shoe-store-default` y `fashion-store-default` siguen existiendo como tenants demo/legacy
- la fuente de verdad narrativa deja de ser `verticalId` y pasa a `itemInteractionMode`
- nuevos tenants no deben diseñarse alrededor de la taxonomía `shoe-store` / `fashion-store`

---

### ADR-018: Onboarding B2B V1 por alta manual asistida ✅ DECIDIDO

**Contexto:** El código actual no soporta alta autónoma de `tenant_owner` ni creación pública de tenants. Implementar self-serve B2B ahora obligaría a tocar auth, roles, provisioning, compra B2B y estados intermedios de onboarding.

**Decisión:** En V1, el onboarding de nuevas tiendas B2B será asistido/manual. NubeKids crea `tenant` + `tenant_owner` y después ese usuario entra ya provisionado para comprar packs B2B.

**Razón:**
- menor riesgo técnico
- menor superficie de bugs en pagos y permisos
- mejor encaje con el volumen actual de leads, que todavía no justifica self-serve

**Consecuencia:**
- el CTA B2B debe llevar a contacto / activación, no a signup autónomo de tenant
- el self-serve B2B queda como fase posterior, no como requisito actual del MVP

---

## Roadmap de Implementación

### ✅ Fase 1 — Refactor Multitenancy (COMPLETADA)
- [x] Ampliar types.ts con TenantConfig, AgeGroup, PedagogyProfile, AgentBrief
- [x] Crear configs de tenant (shoe-store, fashion-store, direct-b2c)
- [x] Crear tenantLoader.ts con soporte para ?tenant= y ?token=
- [x] Integrar Supabase para validación de tokens
- [x] Añadir campos integrationLevel, storeName, itemLabelSingular
- [x] Refactor 2026-04-04: introducir `itemInteractionMode` y desacoplar semántica narrativa de `tenant`

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

### ✅ Fase 6 — Bugfix + Estabilización (COMPLETADA)
- [x] FIX CRÍTICO: Bug de imágenes vacías (regresión del RAG V2)
- [x] FIX: Book container demasiado pequeño
- [x] FIX: PDF orientación landscape (no portrait)
- [x] Crear `src/lib/supabase.ts` (cliente singleton, fix warning "Multiple GoTrueClient")
- [x] Limpiar logs debug de ragService.ts
- [x] FIX: Warning React en StepHero (setState durante render)

### ✅ Fase 7 — Autenticación (COMPLETADA)
- [x] Crear tablas SQL: `profiles`, tipo enum `user_role`
- [x] Crear trigger `on_auth_user_created`
- [x] Configurar Google OAuth en Supabase Dashboard
- [x] Crear `src/services/authService.ts`
- [x] Crear `src/hooks/useAuth.ts`
- [x] Crear componentes: `LoginPage.tsx`, `SignUpPage.tsx`, `AuthCallback.tsx`
- [x] Configurar RLS policies en todas las tablas
- [ ] Google OAuth funcional en local (pendiente de dominio — no bloqueante)

### ✅ Fase 8 — Sistema de Créditos (COMPLETADA)
- [x] Crear tablas SQL: `credit_accounts`, `credit_transactions`, `credit_packs`
- [x] Crear funciones RPC: `consume_credit()`, `add_credits()`
- [x] Insertar catálogo de packs (B2B Standard, B2B Premium, B2C)
- [x] Crear `src/services/creditService.ts`
- [x] Crear `src/hooks/useCredits.ts`
- [x] Crear `src/components/credits/CreditBalance.tsx` (badge en header)
- [x] Crear `src/components/credits/NoCreditsBanner.tsx`
- [x] Integrar en App.tsx: `consumeCredit()` ANTES de iniciar generación

### ✅ Fase 9 — Stripe + Compra de Créditos (COMPLETADA)
- [x] Crear 9 productos y prices en Stripe (modo LIVE desde inicio)
- [x] Actualizar `credit_packs` con `stripe_price_id`
- [x] Crear `api/stripe/create-checkout.ts` (Vercel serverless function)
- [x] Crear `api/stripe/webhook.ts` (Vercel serverless function)
- [x] Crear `src/services/stripeService.ts` (frontend: redirect a checkout)
- [x] Crear `src/components/credits/BuyCredits.tsx` (pantalla de compra)
- [x] Crear `src/components/credits/CreditsSuccess.tsx` (confirmación post-pago)
- [x] Test end-to-end con Stripe CLI — webhook verificado
- [x] Deploy en Vercel exitoso

### ✅ Landing Pages B2B + B2C (COMPLETADA — 02 Abril 2026)
- [x] `public/b2b.html` — Landing B2B orientada a conversión de tiendas online
- [x] Hero con gancho de ventas (no tecnológico)
- [x] 3 pilares: incentivo compra / upsell checkout / recuperar carritos
- [x] Diferenciación clara Standard vs Premium (guión vs ilustraciones)
- [x] Tabla rojo/verde: problemas vs soluciones
- [x] Banda emocional: vínculo marca-familia
- [x] Sección matemática "La cuenta de la vieja"
- [x] Precios B2B revisados al alza
- [x] Sin ninguna mención a "IA"
- [x] CTAs a `/buy-credits`
- [x] `public/b2c.html` — Landing B2C para padres
- [x] ⚠️ Sincronizar nuevos precios B2B en Stripe + Supabase + BuyCredits.tsx

### ✅ Fase 10 — Flujo B2B → B2C Completo (COMPLETADA)
- [x] Implementar carga de `item_image` desde URL (`src/utils/itemImageLoader.ts`) — 3 fallbacks CORS
- [x] Ampliar query params soportados: `?tenant=&item=&item_image=&customer_email=&ref=`
- [x] Implementar lógica de sesión anónima (1er cuento gratis via tenant)
- [x] Pantalla "Promoción no disponible" si tenant sin créditos (`promo-unavailable`)
- [x] Implementar flujo "crear otro cuento" → `PostStoryActions.tsx` → registro B2C
- [x] Pre-rellenar email en registro si viene en query param (`initialEmail` en `SignUpPage`)
- [x] Pre-rellenar nombre e imagen del producto en Step 3 del wizard
- [x] Herramienta de testing: `docs/nubekids_b2b2c_simulator.html`
- [x] Documentación de integración para tenants: `docs/INTEGRACION_PREMIUM.md`
- [x] Fix fuentes: importar Fredoka + Nunito en `index.css`
- [x] Deploy en Vercel funcional — TypeScript sin errores
- [x] **Referencia:** `BUSINESS_TECH_SPEC.md` § 5 y § 6

### ⏳ Fase 11 — Dominio + Deploy + Legal (PENDIENTE)
- [ ] Comprar dominio
- [ ] Configurar DNS en Vercel
- [ ] Configurar Stripe webhook con URL de producción
- [ ] Google OAuth funcional (requiere dominio)
- [ ] Crear política de privacidad (GDPR, datos de menores)
- [ ] Crear términos de servicio
- [ ] Crear aviso legal
- [ ] Crear política de cookies
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
| Precios B2B desincronizados (landing vs Stripe vs Supabase) | **ALTA** | ⏳ Pendiente | - |
| Algunas referencias históricas aún describen el modelo previo y deben leerse con nota de compatibilidad | Baja | ⚠️ Controlado con notas explícitas | - |
| Doble generación mismo usuario anónimo (2 pestañas) | Baja | Aceptable V1 — consume_credit es atómico | 10 |
| Fuentes Fredoka/Nunito no importadas en index.css | Media | ✅ Resuelto sesión 2026-04-02 | 10 |
| Google OAuth en GCP + Supabase | Media | ⏳ Cuando haya dominio | 7 |
| `consumeCredit` sin refund si falla generación | Media | Aceptable V1 | 8 |
| Webhook Stripe apunta a URL Vercel temporal | Media | Actualizar al tener dominio | 9 |
| Violations react-pageflip touchstart | Baja | Ignorable (librería externa) | 4 |
| No hay tests unitarios | Alta | Pendiente | - |
| OCR para 4 PDFs de solo imágenes | Media | Pendiente | 5 |
| Tags vacíos en rag_chunks | Baja | Semántica pura OK | 5 |

---

## Dependencias Externas

| Servicio | Uso | Estado |
|----------|-----|--------|
| Supabase | Auth + DB + RAG V2 pgvector | ✅ Integrado |
| Gemini API | Texto + Imagen + Embeddings | ✅ Integrado |
| Stripe | Pagos — Checkout Sessions + Webhook | ✅ Live mode |
| Vercel | Deploy frontend + API routes | ✅ Funcionando |
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
| `PLANNING.md` | Este documento — ADRs, roadmap |
| `HANDOFF.md` | Estado actual, bugs, estructura de archivos |
| `BUSINESS_TECH_SPEC.md` | Auth, créditos, Stripe, integración B2B, pseudocódigo |
| `nubekids_DD_Design_Document.md` | Guía de diseño UI/UX — aplicar en landings y componentes |
| `docs/GUIA_RAG_V2.md` | Guía técnica RAG V2 |
