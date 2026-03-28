# TASK.md — NubeKids Task Tracker

> Consultar antes de empezar una tarea. Marcar como completada al terminar.
> Añadir sub-tareas descubiertas durante el trabajo en "Discovered During Work".

---

## Fase 1: Refactor Multitenancy

### Pendiente
- [ ] **T1.1** Ampliar `src/types.ts` — Añadir TenantConfig, VerticalId, AgeGroup, AgeGroupConfig, AGE_GROUP_CONFIGS, PedagogyProfile, AgentBrief (2026-03-24)
- [ ] **T1.2** Renombrar `shoeImageBase64` → `itemImageBase64` en TODOS los archivos (commit atómico) (2026-03-24)
- [ ] **T1.3** Renombrar `Beat.shoeDescription` → `Beat.itemDescription` si existe (2026-03-24)
- [ ] **T1.4** Crear `src/config/tenants/shoe-store.config.ts` (2026-03-24)
- [ ] **T1.5** Crear `src/config/tenants/fashion-store.config.ts` (2026-03-24)
- [ ] **T1.6** Crear `src/config/tenants/direct-b2c.config.ts` (2026-03-24)
- [ ] **T1.7** Crear `src/config/tenantLoader.ts` con lectura de query params (2026-03-24)
- [ ] **T1.8** Crear `src/hooks/useTenantConfig.ts` (2026-03-24)
- [ ] **T1.9** Modificar `Setup.tsx` — labels dinámicos con tenantConfig.itemLabel (2026-03-24)
- [ ] **T1.10** Extraer PDF export de App.tsx → `src/utils/pdfExport.ts` (2026-03-24)
- [ ] **T1.11** Crear `src/utils/imageUtils.ts` — compresión/resize client-side (2026-03-24)

### Completado
(ninguno aún)

---

## Fase 2: Age Group System

### Pendiente
- [ ] **T2.1** Crear `src/components/AgeGroupSelector.tsx` — selector visual obligatorio
- [ ] **T2.2** Integrar Age Group en validación de "Start Adventure" (disabled sin AgeGroup)
- [ ] **T2.3** Reemplazar "Novel Mode" toggle por AgeGroupSelector en Setup.tsx
- [ ] **T2.4** Pasar AgeGroupConfig al Storytelling Agent en geminiService.ts

### Completado
(ninguno aún)

---

## Fase 3: Sistema Multiagente + RAG

### Pendiente
- [ ] **T3.1** Crear `src/services/agents/orchestratorAgent.ts`
- [ ] **T3.2** Crear `src/services/agents/narrativeAgent.ts`
- [ ] **T3.3** Crear `src/services/agents/storytellingAgent.ts`
- [ ] **T3.4** Crear `src/services/agents/visualBriefAgent.ts`
- [ ] **T3.5** Crear `src/services/ragService.ts` — filtrado por tags
- [ ] **T3.6** Crear `src/data/rag/neuro-dev.chunks.ts` — chunks iniciales
- [ ] **T3.7** Crear `src/data/rag/child-psych.chunks.ts`
- [ ] **T3.8** Crear `src/data/rag/storytelling.chunks.ts`
- [ ] **T3.9** Crear `parseJsonSafely()` utility — strip markdown fences + try/catch
- [ ] **T3.10** Modificar `geminiService.ts` — integrar pipeline multiagente
- [ ] **T3.11** Implementar sanitización de baseSystemPrompt del tenant

### Completado
(ninguno aún)

---

## Fase 4: Pedagogy Mode

### Pendiente
- [ ] **T4.1** Crear `src/components/PedagogyForm.tsx` — chips seleccionables + textarea
- [ ] **T4.2** Crear `src/hooks/usePedagogyForm.ts` — estado y validación
- [ ] **T4.3** Integrar PedagogyProfile en narrativeAgent.ts (null si disabled)
- [ ] **T4.4** Verificar que arco narrativo refleja objetivo pedagógico en tests

### Completado
(ninguno aún)

---

## Discovered During Work

(Añadir aquí sub-tareas o issues descubiertos durante la implementación)

---

## Convención

- Formato: `[x]` completado, `[ ]` pendiente
- Cada tarea incluye ID (`T1.1`), descripción, y fecha de creación
- Al completar: mover de "Pendiente" a "Completado" con fecha
- Si una tarea genera sub-tareas: añadir en "Discovered During Work" con referencia al padre
