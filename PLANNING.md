# PLANNING.md — NubeKids Platform

> Documento vivo de decisiones arquitectónicas y roadmap.
> Leer al inicio de cada sesión junto con CLAUDE.md y HANDOFF.md.
> 
> **Última actualización:** 2026-03-27

---

## Decisiones Arquitectónicas (ADRs)

### ADR-001: Serverless MVP → Google Cloud Run en escala

**Contexto:** Necesitamos desplegar rápido para validar el producto sin inversión en infraestructura.

**Decisión:** MVP en Vercel (frontend) + Vercel Edge Functions / CF Workers (API). Migración a Google Cloud Run cuando el producto valide.

**Razón:**
- Vercel Pro permite 300s de timeout en serverless functions (suficiente para pipeline multiagente).
- Cloud Run es el salto natural: misma lógica en contenedor, sin límites de timeout, proximidad nativa a Gemini API.
- No requiere reescribir — solo empaquetar en contenedor Docker.

**Consecuencias:**
- Diseñar la API como funciones stateless desde el principio.
- No depender de estado en servidor (todo en sesión del navegador o query params).
- Abstraer la capa de IA para que funcione igual en Edge Function y en Cloud Run.

---

### ADR-002: RAG V1 por Tags → V2 pgvector

**Contexto:** Necesitamos que el sistema multiagente tenga contexto pedagógico.

**Decisión V1:** Chunks RAG como archivos TypeScript tipados (`.ts`), filtrados por tags en runtime.

**Razón V1:**
- Máximo ~200k tokens de colecciones RAG es manejable con Gemini Long Context.
- El filtrado por tags (age:tiny, topic:night-fears) es suficiente para el MVP.
- Evita complejidad de infraestructura antes de validar product-market fit.

**Decisión V2 (Cuando aplique):** Supabase pgvector + gemini-embedding-001.

**Trigger para V2:**
- Más de 100 chunks
- Filtrado por tags insuficiente (queries no encuentran chunks relevantes)
- Necesidad de búsqueda semántica real

**Proveedor elegido:** Supabase (ya integrado para tokens).

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

**Razón:**
- Simplifica el wizard (menos campos)
- Es lógico: el cuento es para un niño de esa edad
- Menos decisiones para el usuario

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

### 🔄 Fase 3 — Sistema Multiagente + RAG (EN PROGRESO)
- [ ] Crear jsonParser.ts (parseJsonSafely robusto)
- [ ] Crear dependencies.ts (contexto de sesión)
- [ ] Crear ragService.ts V1 (filtrado por tags)
- [ ] Crear chunks RAG iniciales (neuro-dev, child-psych, storytelling)
- [ ] Crear storytellingAgent.ts
- [ ] Crear narrativeAgent.ts
- [ ] Crear visualBriefAgent.ts
- [ ] Crear orchestratorAgent.ts
- [ ] Integrar pipeline en App.tsx
- [ ] Testing end-to-end

### ⏳ Fase 4 — RAG V2 con pgvector (PENDIENTE)
- [ ] Convertir PDFs a markdown
- [ ] Chunkear markdown (~500 tokens)
- [ ] Generar embeddings con gemini-embedding-001
- [ ] Crear tabla en Supabase con pgvector
- [ ] Actualizar ragService.ts para búsqueda semántica

### ⏳ Fase 5 — Widget Embebible + API (PENDIENTE)
- [ ] Diseñar API REST para sesiones
- [ ] Implementar widget embebible (iframe / Web Component)
- [ ] Implementar inyección de item_model desde checkout
- [ ] Deploy serverless (Vercel)

---

## Deuda Técnica Conocida

| Item | Prioridad | Estado |
|------|-----------|--------|
| PDF export hardcodeado en App.tsx — extraer a pdfExport.ts | Media | Pendiente |
| Imágenes base64 en React state — migrar a refs | Alta | Pendiente |
| No hay compresión de imágenes client-side | Media | Pendiente |
| No hay tests unitarios | Alta | Pendiente |
| Loading states genéricos — personalizar con itemLabel | Baja | Pendiente |
| Imágenes de estilos visuales para StepStory | Media | Pendiente |

---

## Dependencias Externas

| Servicio | Uso | Estado |
|----------|-----|--------|
| Supabase | Tokens B2B + (futuro) pgvector | ✅ Integrado |
| Gemini API | Texto + Imagen + (futuro) Embeddings | ✅ Integrado |
| Vercel | Deploy (futuro) | ⏳ Pendiente |

---

## Métricas de Éxito (Cuando tengamos analytics)

| Métrica | Objetivo |
|---------|----------|
| Wizard completion rate | > 70% |
| Time to first page | < 8 segundos |
| Stories completed | > 60% de iniciados |
| PDF downloads | > 80% de completados |
