# CLAUDE.md — NubeKids SaaS Platform
# Documento de contexto universal para agentes de IA.
# Compatible con Claude Code, Cursor, Windsurf, Copilot y cualquier LLM.

---

## 🧠 Identidad del Proyecto

**NubeKids** es una plataforma SaaS multitenant B2B que genera cuentos infantiles personalizados con IA.
El core es un motor multiagente (Gemini) + RAG pedagógico que crea historias donde el niño es el protagonista visual
y un artículo comprado (zapatos, ropa) tiene poderes mágicos.

### Vocabulario del Dominio (OBLIGATORIO en todo el código)

| Término | Significado | Dónde aparece |
|---------|-------------|---------------|
| **Tenant** | Tienda B2B cliente de NubeKids (shoe-store, fashion-store) | Config, API, dashboard |
| **Vertical** | Tipo de negocio del tenant (`shoe-store`, `fashion-store`, `direct-b2c`) | TenantConfig.verticalId |
| **Item Mágico** | El artículo que tiene poderes en el cuento (zapatos, prenda) | `itemLabel`, `itemImageBase64` |
| **Age Group** | Grupo de edad del lector: `tiny` (3-4), `little` (5-6), `reader` (7-10) | Obligatorio en Setup |
| **Pedagogy Mode** | Modo B: cuento con intención pedagógica personalizada | PedagogyProfile |
| **Beat** | Unidad narrativa = 1 página del cuento (escena + texto + dirección visual) | Beat[] en AgentBrief |
| **AgentBrief** | Output completo del pipeline multiagente antes de generar páginas | Orchestrator → páginas |
| **Panel** | Renderizado visual de un Beat en el libro (imagen + caption) | Panel.tsx |
| **ComicFace** | Estado de una página del libro (loading, imagen, narrative, choices) | ComicFace en types.ts |

### Regla de Oro del Naming

```
❌ PROHIBIDO: shoeImageBase64, shoeDescription, "zapatos" hardcodeado
✅ OBLIGATORIO: itemImageBase64, itemDescription, tenantConfig.itemLabel
```

Todo lo que antes era "shoe" ahora es "item". `tenantConfig.itemLabel` define el término visible ("zapatos", "prenda", "accesorio").

---

## 🏗️ Arquitectura

### Stack Tecnológico

| Capa | Tecnología | Notas |
|------|------------|-------|
| **Frontend** | React 18+ · TypeScript · Vite · Tailwind CSS | SPA con estado en memoria |
| **API/Backend MVP** | Vercel Edge Functions / Cloudflare Workers | Serverless, timeout extendido para agentes |
| **API/Backend Escala** | Google Cloud Run | Misma lógica, sin límites de timeout |
| **Motor IA** | Gemini API (`@google/genai`) | Texto multimodal + generación de imagen |
| **Modelo de imagen** | `gemini-2.0-flash-exp` (texto) + modelo de imagen Gemini | Ver nota anti-pattern abajo |
| **RAG V1** | Long Context (chunks .ts taggeados) | Sin vector DB en MVP |
| **RAG V2** | Gemini Embeddings (`gemini-embedding-001`) + pgvector/Pinecone | Post-MVP |
| **Export** | jsPDF client-side | PDF portrait, alta resolución |
| **Estado** | React state + refs para imágenes base64 | No Redux, no Zustand en V1 |

### Estructura del Codebase (V2 objetivo)

```
src/
├── main.tsx
├── App.tsx                         # Orquestador + estado global
├── types.ts                        # TenantConfig, AgeGroup, PedagogyProfile, AgentBrief, Beat, etc.
├── config/
│   ├── tenants/
│   │   ├── shoe-store.config.ts    # Vertical calzado
│   │   ├── fashion-store.config.ts # Vertical moda
│   │   └── direct-b2c.config.ts    # Canal B2C directo
│   └── tenantLoader.ts             # Carga config por ?tenant= query param
├── components/
│   ├── Setup.tsx                   # Dashboard de configuración (Age Group, Pedagogy, item_model)
│   ├── PedagogyForm.tsx            # Formulario de personalización pedagógica
│   ├── AgeGroupSelector.tsx        # Selector visual de grupo de edad (obligatorio)
│   ├── Book.tsx                    # Contenedor del libro
│   ├── Panel.tsx                   # Página individual del cuento
│   ├── ApiKeyDialog.tsx            # Modal de API Key
│   └── LoadingFX.tsx               # Estados de carga con personalidad
├── hooks/
│   ├── useApiKey.ts
│   ├── useTenantConfig.ts          # Lee y expone config del tenant activo
│   └── usePedagogyForm.ts          # Estado y validación del formulario pedagógico
├── services/
│   ├── geminiService.ts            # Integra sistema multiagente
│   ├── agents/
│   │   ├── orchestratorAgent.ts    # Coordina pipeline completo
│   │   ├── narrativeAgent.ts       # Neuroeducador + Psicólogo Infantil
│   │   ├── storytellingAgent.ts    # Escritor Creativo (calibra por Age Group)
│   │   └── visualBriefAgent.ts     # Ilustrador Conceptual (prompts de imagen)
│   └── ragService.ts               # RAG V1: filtrado por tags
├── data/
│   └── rag/                        # Chunks RAG tipados (.ts)
│       ├── neuro-dev.chunks.ts
│       ├── child-psych.chunks.ts
│       └── storytelling.chunks.ts
└── utils/
    ├── pdfExport.ts                # Export PDF extraído de App.tsx
    └── imageUtils.ts               # Compresión/resize client-side
```

---

## 🔒 Reglas Inviolables (para TODOS los agentes/LLMs)

### Contenido Infantil
1. **Output 100% positivo.** Sin violencia, sin temas oscuros, sin lenguaje inapropiado. Jamás.
2. **Las guardrails NO son anulables.** El `baseSystemPrompt` del tenant NUNCA puede override las protecciones de contenido.
3. **Sanitizar prompts de tenant** antes de inyectarlos en el contexto de los agentes.

### Pipeline Multiagente
4. **Ejecución SECUENCIAL.** Orchestrator → Narrative → Storytelling → Visual Brief. Nunca `Promise.all()`.
5. **AgentBrief ANTES de generar páginas.** Sin brief completo, no se genera ni una imagen.
6. **JSON parsing robusto.** Siempre `stripMarkdownFences()` + `try/catch` en `JSON.parse()`. Gemini NO devuelve JSON limpio.
7. **Pasar AgentBrief como contexto** a CADA llamada de `generateBeat` + `generateImage`.

### Age Group
8. **Age Group es OBLIGATORIO.** Botón "Start Adventure" deshabilitado sin selección de Age Group.
9. **Calibración estricta por Age Group:**
   - `tiny` (3-4): máx 20 palabras/página, frases simples, onomatopeyas
   - `little` (5-6): máx 50 palabras/página, conectores básicos, emociones nombradas
   - `reader` (7-10): máx 120 palabras/página, vocabulario rico, dilemas morales leves

### Multitenancy
10. **NUNCA hardcodear "zapatos".** Siempre `tenantConfig.itemLabel`.
11. **Aislamiento de tenants.** Cada tenant tiene su propia config, branding y prompts.
12. **item_model inyectable.** Desde query param `?item=` o editable en Setup si `allowUserEditItem = true`.

### Pedagogy Mode
13. **Si `pedagogy.enabled = false`, pasar `null` al Narrative Agent.** Nunca un perfil vacío.
14. **El arco narrativo DEBE reflejar el objetivo pedagógico** cuando Modo B está activo.

### Rendimiento
15. **No almacenar base64 grandes en React state.** Usar refs para historial de imágenes.
16. **Comprimir/redimensionar imágenes client-side** antes de enviar a la API.
17. **Generación progresiva.** Primeras páginas legibles mientras las siguientes se generan.

---

## 🧪 Convenciones de Código

### TypeScript
- **Strict mode** habilitado. No `any` sin justificación.
- **Interfaces sobre types** para objetos de dominio (TenantConfig, AgeGroupConfig, etc.).
- **Enums como const** (`as const`) para GENRES, LANGUAGES.
- **Paths absolutos** con alias `@/` en tsconfig para imports.

### React
- **Functional components** exclusivamente. No class components.
- **Custom hooks** para lógica reutilizable (useTenantConfig, usePedagogyForm).
- **Props explícitas** con interfaces dedicadas (no inline types).

### Tailwind CSS
- **Design system del DD (Design Document):**
  - Background: `#FDFBF7` (Soft Cream)
  - Primary: `#8B5CF6` (Magic Purple)
  - Accent: `#FBBF24` (Sneaker Yellow)
  - Success: `#34D399` (Mint Green)
  - Text: `#1E293B` (Ink Black)
- **Botones táctiles:** borde 3-4px, sombra dura `4px 4px 0px`, efecto press en hover.
- **Mobile-first.** Diseño stacked en mobile, dos columnas en desktop.

### Naming
- **Archivos:** PascalCase para componentes (`AgeGroupSelector.tsx`), camelCase para utils (`pdfExport.ts`).
- **Variables/funciones:** camelCase.
- **Interfaces/Types:** PascalCase con prefijo semántico (`TenantConfig`, `AgeGroupConfig`).
- **Constantes:** UPPER_SNAKE_CASE (`AGE_GROUP_CONFIGS`, `GENRES`).

### Testing
- **Vitest** como test runner (compatible con Vite).
- Tests en carpeta `__tests__/` junto al archivo que testean.
- Mínimo por feature: 1 happy path + 1 edge case + 1 error case.

---

## 🚫 Anti-Patterns Explícitos

```
❌ No usar gemini-2.5-flash-image. Usar el modelo correcto para imagen multimodal.
❌ No asumir que Gemini devuelve JSON limpio. SIEMPRE strip markdown + try/catch.
❌ No ejecutar agentes en paralelo (Promise.all). Son secuenciales por diseño.
❌ No almacenar base64 grandes en React state si causan re-renders. Usar refs.
❌ No permitir que el system prompt del tenant anule guardrails de contenido infantil.
❌ No hardcodear "zapatos" en el código. SIEMPRE usar tenantConfig.itemLabel.
❌ No implementar vector DB en V1. El RAG de filtrado por tags es suficiente.
❌ No saltarse el Orchestrator Agent y llamar directamente al Storytelling Agent.
❌ No olvidar pasar AgentBrief como contexto a CADA llamada de generateBeat.
❌ No usar <select> nativo del navegador. Dropdowns custom estilo Design System.
```

---

## 📋 Flujo de Trabajo con PRPs

Este proyecto usa el patrón **PRP (Product Requirements Prompt)** para implementar features:

```bash
# 1. Definir requisitos en INITIAL.md o feature file
# 2. Generar PRP con contexto completo
/generate-nubekids-prp INITIAL.md

# 3. Ejecutar PRP (implementar + validar)
/execute-nubekids-prp PRPs/feature-name.md
```

### Validación Estándar (ejecutar tras cada feature)

```bash
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript strict
npm run test          # Vitest
npm run build         # Vite build sin errores
```

---

## 📚 Referencias Clave

| Recurso | URL / Path |
|---------|------------|
| Gemini SDK (JS) | https://www.npmjs.com/package/@google/genai |
| Gemini Long Context | https://ai.google.dev/gemini-api/docs/long-context |
| Gemini Embeddings | Ver `PRPs/ai_docs/gemini_embeddings.md` |
| jsPDF docs | https://artskydj.github.io/jsPDF/docs/jsPDF.html |
| Design Document | `nubekids_DD_Design_Document.md` |
| PRD v2 | `nubekids_PRD_v2.md` |
| PRP v2 (técnico) | `nubekids_PRP_v2.md` |
