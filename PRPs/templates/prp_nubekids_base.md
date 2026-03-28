name: "NubeKids PRP Base Template — Context Engineering para SaaS Multitenant"
description: |

## Purpose
Template optimizado para agentes de IA que implementen features en NubeKids con contexto suficiente
del dominio (multitenancy, pipeline multiagente, Age Groups, pedagogía) para lograr código funcional
en una pasada con refinamiento iterativo.

## Core Principles
1. **Context is King**: Incluir TODO el contexto de dominio NubeKids necesario
2. **Validation Loops**: Tests ejecutables + validación de dominio (multitenancy, Age Groups, safety)
3. **Information Dense**: Vocabulario del dominio, data models, gotchas
4. **Progressive Success**: Empezar simple, validar, mejorar
5. **Global rules**: Seguir siempre CLAUDE.md

---

## Goal
[Qué se va a construir — sé específico sobre el estado final]

## Why
- [Valor de negocio: ¿qué vertical/tenant se beneficia?]
- [Integración con features existentes del pipeline NubeKids]
- [Problemas que resuelve para padres/tenants/niños]

## What
[Comportamiento visible al usuario + requisitos técnicos]

### Success Criteria
- [ ] [Outcome medible — incluir criterios de dominio NubeKids]
- [ ] La app lee configuración del tenant y adapta UI/prompts/labels
- [ ] El Age Group seleccionado calibra correctamente el output
- [ ] Pasa `npm run lint && npx tsc --noEmit && npm run test && npm run build`

## All Needed Context

### NubeKids Domain Context
```yaml
# Documenta qué aspectos del dominio toca esta feature
verticales_afectadas: [shoe-store, fashion-store, direct-b2c]  # o subset
age_groups_afectados: [tiny, little, reader]                     # o subset
agentes_involucrados: [narrative, storytelling, visual-brief]     # o ninguno
pedagogy_relevante: true/false
tenant_config_fields: [itemLabel, brandColors, pedagogyEnabled]   # campos usados
```

### Documentation & References
```yaml
# MUST READ según la feature
- file: CLAUDE.md
  why: Reglas inviolables, vocabulario del dominio, anti-patterns

- file: .claude/rules/[relevant-rule].md
  why: Convenciones específicas del área (multiagente, tenant, UI, RAG)

- file: src/types.ts
  why: Data models — interfaces que se amplían o consumen

- url: [URL relevante de Gemini API, jsPDF, etc.]
  why: [Sección específica necesaria]
```

### Data Models Relevantes
```typescript
// Incluir SOLO las interfaces que esta feature toca o consume
// Copiar de src/types.ts las interfaces relevantes
```

### Known Gotchas de NubeKids
```
# CRÍTICO: [Gotcha específico de esta feature]
# Ejemplo: "Age Group es OBLIGATORIO — Start Adventure disabled sin selección"
# Ejemplo: "JSON de agentes siempre necesita stripMarkdownFences + try/catch"
# Ejemplo: "No hardcodear 'zapatos' — usar tenantConfig.itemLabel"
```

## Implementation Blueprint

### Codebase Actual (archivos que existen)
```bash
# Solo los archivos relevantes para esta feature
```

### Archivos a Crear/Modificar
```bash
# Lista con responsabilidad de cada archivo
```

### Tasks Ordenadas por Dependencia
```yaml
Task 1: [nombre descriptivo]
  MODIFY/CREATE: src/path/to/file.ts
  - Qué hacer y por qué
  - Patterns a seguir
  Depends on: none

Task 2: [nombre descriptivo]
  MODIFY/CREATE: src/path/to/file.ts
  - Qué hacer y por qué
  Depends on: Task 1

# ...continuar...
```

### Pseudocódigo por Task (donde sea necesario)
```typescript
// Pseudocódigo con detalles CRÍTICOS de NubeKids
// Ejemplo: cómo inyectar guardrails después del prompt del tenant
// Ejemplo: cómo filtrar RAG chunks por tags
// Ejemplo: cómo validar Age Group antes de habilitar Start Adventure
```

### Integration Points
```yaml
TENANT_CONFIG:
  - Si la feature varía por vertical, documentar qué campos de TenantConfig se usan
  
AGE_GROUP:
  - Si la feature genera contenido, documentar cómo se calibra por Age Group

MULTIAGENT_PIPELINE:
  - Si la feature toca agentes, documentar el flujo secuencial afectado

UI/DESIGN_SYSTEM:
  - Si la feature toca UI, referenciar colores, tipografías, botones del DD
```

## Validation Loop

### Level 1: Syntax & Types
```bash
npm run lint
npx tsc --noEmit
# Expected: 0 errors
```

### Level 2: Unit Tests
```typescript
// Tests específicos para la feature
// Incluir: happy path + edge case + error case
// Para agentes: verificar que respetan maxWordsPerPage
// Para tenants: verificar que no hay strings hardcodeados
```

```bash
npm run test
```

### Level 3: Domain Validation
```bash
# Verificar multitenancy
grep -r "zapatos\|shoes\|sneakers" src/ --include="*.tsx" --include="*.ts" | grep -v "config\|chunk"
# Expected: 0 resultados

# Verificar Age Group obligatorio (si aplica)
# Verificar pipeline secuencial (si aplica)
# Verificar guardrails (si aplica)
```

### Level 4: Integration Test Manual
```bash
npm run dev

# TEST A — Verificar con vertical shoe-store
# http://localhost:5173/?tenant=shoe-store-default
# [Pasos específicos de la feature]

# TEST B — Verificar con vertical fashion-store
# http://localhost:5173/?tenant=fashion-store-default
# [Verificar que la feature funciona cambiando solo config]
```

## Final Validation Checklist

```
□ npm run lint → 0 errores
□ npx tsc --noEmit → 0 errores de tipo
□ npm run test → todos los tests pasan
□ npm run build → build exitoso
□ No hay "zapatos" hardcodeado fuera de configs
□ Labels usan tenantConfig.itemLabel
□ Colores usan CSS variables de marca
□ Age Group validado como obligatorio (si aplica)
□ Pipeline multiagente secuencial (si aplica)
□ Guardrails no anulables por prompt de tenant (si aplica)
□ Feature funciona en shoe-store Y fashion-store
□ [Criterios específicos de la feature]
```

## Anti-Patterns a Evitar

```
❌ [Anti-patterns relevantes para esta feature específica]
❌ No hardcodear "zapatos" — siempre tenantConfig.itemLabel
❌ No ejecutar agentes en paralelo — secuencial obligatorio
❌ No asumir JSON limpio de Gemini — stripMarkdownFences + try/catch
❌ No saltarse la validación de Age Group
❌ No inyectar prompt de tenant sin guardrails posteriores
```
