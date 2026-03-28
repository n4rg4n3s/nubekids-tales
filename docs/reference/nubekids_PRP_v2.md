# Product Requirements Prompt (PRP) v2.0
# NubeKids — AI Storybook Engine · SaaS Multitenant B2B Platform

> **Template optimizado para agentes de IA** que implementen features con contexto suficiente y capacidades de auto-validación para lograr código funcional a través de refinamiento iterativo.

---

## Principios del Template

1. **Context is King**: Incluir TODA la documentación necesaria, ejemplos y caveats.
2. **Validation Loops**: Proveer tests/lints ejecutables que la IA pueda correr y corregir.
3. **Information Dense**: Usar keywords y patrones del codebase existente.
4. **Progressive Success**: Empezar simple, validar, luego mejorar.
5. **Global rules**: Seguir siempre las reglas en `CLAUDE.md`.

---

## Goal

Evolucionar "Magic Sneakers" (app single-tenant de generación de cuentos) hacia **NubeKids**: una plataforma SaaS multitenant B2B con:

1. **Core Engine** reutilizable: motor de IA multiagente + RAG pedagógico.
2. **Sistema de Verticales** configurables (shoe-store, fashion-store, direct-b2c).
3. **Widget embebible** para integración en checkouts de tiendas.
4. **Age Group System** (reemplaza Novel Mode) con calibración narrativa por tramo de edad.
5. **Pedagogy Mode** con formulario de personalización psicopedagógica.

---

## Why

- **Business value**: Convierte la app de demo en un producto SaaS comercializable con múltiples fuentes de ingresos (tenants B2B + canal B2C directo).
- **Diferenciación técnica**: El sistema multiagente con RAG científico crea una barrera de entrada real frente a competidores genéricos.
- **Escalabilidad de verticales**: El diseño multitenante permite lanzar una nueva vertical (ej. moda infantil) cambiando configuración, no código.

---

## What

### Fase 1 — Refactor hacia Multitenancy

Reestructurar el codebase actual para soportar configuración de tenant, inyección de `item_model` desde checkout y sistema de verticales.

### Fase 2 — Age Group System

Reemplazar "Novel Mode" por un sistema de 3 grupos de edad (`tiny`, `little`, `reader`) que calibra vocabulario, longitud de texto, estructura narrativa y complejidad emocional.

### Fase 3 — Sistema Multiagente + RAG

Implementar el Orchestrator y los agentes especializados. Conectar con el RAG pedagógico.

### Fase 4 — Pedagogy Mode

Implementar el formulario de personalización pedagógica y la lógica del Narrative Agent para incorporar los inputs del formulario en el brief narrativo.

### Criterios de Éxito

- [ ] La app lee la configuración de tenant desde `tenantConfig` y adapta UI, prompts y labels.
- [ ] El `item_model` se inyecta desde query param o se edita manualmente en el Setup.
- [ ] El selector Age Group es obligatorio y calibra correctamente el output narrativo.
- [ ] El formulario de personalización pedagógica (Modo B) influye en el arco narrativo generado.
- [ ] Los agentes (Orchestrator, Narrative, Storytelling, Visual Brief) se ejecutan secuencialmente y sus outputs son verificables.
- [ ] Una segunda vertical (`fashion-store`) funciona correctamente cambiando solo `tenantConfig`.

---

## All Needed Context

### Documentation & References

```yaml
- url: https://www.npmjs.com/package/@google/genai
  why: SDK oficial. Usar para generateContent multimodal y para los agentes.

- url: https://ai.google.dev/gemini-api/docs/long-context
  why: Contexto largo necesario para pasar el historial de agentes y los chunks RAG.

- file: src/services/geminiService.ts
  why: Core AI actual. Base para el refactor hacia sistema multiagente.

- file: src/types.ts
  why: Interfaces actuales. Se ampliarán con TenantConfig, AgeGroup, PedagogyProfile.

- doc: https://artskydj.github.io/jsPDF/docs/jsPDF.html
  section: addImage, addPage
  critical: Export PDF sin cambios respecto a V1.
```

---

## Codebase Actual (V1 — Magic Sneakers)

```
.
├── package.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # Orquestador principal, gestión de estado
│   ├── types.ts                # Interfaces y constantes
│   ├── Setup.tsx               # UI de configuración
│   ├── Book.tsx                # Contenedor del libro
│   ├── Panel.tsx               # Renderizado de página individual
│   ├── ApiKeyDialog.tsx        # Modal de API Key
│   ├── useApiKey.ts            # Hook de localStorage para API Key
│   ├── LoadingFX.tsx           # Efectos visuales durante generación
│   └── services/
│       └── geminiService.ts    # Llamadas a la API de Gemini
```

---

## Codebase Objetivo (V2 — NubeKids Platform)

```
.
├── src/
│   ├── main.tsx
│   ├── App.tsx                       # Orquestador + estado global
│   ├── types.ts                      # AMPLIADO: TenantConfig, AgeGroup, PedagogyProfile, AgentBrief
│   │
│   ├── config/
│   │   ├── tenants/
│   │   │   ├── shoe-store.config.ts  # Config vertical calzado
│   │   │   ├── fashion-store.config.ts # Config vertical moda
│   │   │   └── direct-b2c.config.ts  # Config vertical B2C
│   │   └── tenantLoader.ts           # Carga config según tenant_id (query param / env)
│   │
│   ├── components/
│   │   ├── Setup.tsx                 # MODIFICADO: Age Group, Pedagogy Form, item_model editable
│   │   ├── PedagogyForm.tsx          # NUEVO: Formulario de personalización pedagógica
│   │   ├── AgeGroupSelector.tsx      # NUEVO: Selector visual de grupo de edad
│   │   ├── Book.tsx
│   │   ├── Panel.tsx
│   │   ├── ApiKeyDialog.tsx
│   │   └── LoadingFX.tsx
│   │
│   ├── hooks/
│   │   ├── useApiKey.ts
│   │   ├── useTenantConfig.ts        # NUEVO: Lee y expone la config del tenant activo
│   │   └── usePedagogyForm.ts        # NUEVO: Estado y validación del formulario pedagógico
│   │
│   ├── services/
│   │   ├── geminiService.ts          # MODIFICADO: Integra sistema multiagente
│   │   ├── agents/
│   │   │   ├── orchestratorAgent.ts  # NUEVO: Coordina todos los agentes
│   │   │   ├── narrativeAgent.ts     # NUEVO: Neuroeducador + Psicólogo Infantil
│   │   │   ├── storytellingAgent.ts  # NUEVO: Escritor Creativo (genera beats por Age Group)
│   │   │   └── visualBriefAgent.ts   # NUEVO: Ilustrador Conceptual (genera prompts de imagen)
│   │   └── ragService.ts             # NUEVO: Consulta al RAG (Gemini Long Context o API externa)
│   │
│   └── utils/
│       ├── pdfExport.ts              # Extraído de App.tsx
│       └── imageUtils.ts             # Compresión/resize de imágenes client-side
```

---

## Data Models

### TenantConfig

```typescript
// src/types.ts (AMPLIADO)

export type VerticalId = 'shoe-store' | 'fashion-store' | 'direct-b2c';

export interface TenantConfig {
  tenantId: string;
  tenantName: string;
  verticalId: VerticalId;
  itemLabel: string;              // "zapatos" | "prenda" | "accesorio"
  itemPlaceholderText: string;    // Texto de ayuda en el campo item_model
  allowUserEditItem: boolean;     // Si el usuario final puede editar item_model
  baseSystemPrompt: string;       // Prompt base del tenant (editable en dashboard)
  brandColors: {
    primary: string;
    accent: string;
    background: string;
  };
  brandLogo?: string;             // URL del logo del tenant
  activeLanguages: Language[];
  activeGenres: Genre[];
  pedagogyEnabled: boolean;       // Si el Modo B está disponible para este tenant
  ragCollections: string[];       // IDs de colecciones RAG asignadas
}

export type AgeGroup = 'tiny' | 'little' | 'reader';

export interface AgeGroupConfig {
  label: string;                  // "3-4 años" | "5-6 años" | "7-10 años"
  maxWordsPerPage: number;        // 20 | 50 | 120
  sentenceComplexity: 'simple' | 'medium' | 'rich';
  narrativeStructure: 'linear' | 'simple-arc' | 'complex-arc';
  emotionalDepth: 'basic' | 'secondary' | 'nuanced';
}

export const AGE_GROUP_CONFIGS: Record<AgeGroup, AgeGroupConfig> = {
  tiny:   { label: "3-4 años", maxWordsPerPage: 20,  sentenceComplexity: 'simple',  narrativeStructure: 'linear',      emotionalDepth: 'basic'    },
  little: { label: "5-6 años", maxWordsPerPage: 50,  sentenceComplexity: 'medium',  narrativeStructure: 'simple-arc',  emotionalDepth: 'secondary'},
  reader: { label: "7-10 años",maxWordsPerPage: 120, sentenceComplexity: 'rich',    narrativeStructure: 'complex-arc', emotionalDepth: 'nuanced'  },
};

export interface PedagogyProfile {
  enabled: boolean;               // Si el usuario activó el Modo B
  behaviorChallenges: string[];   // e.g., ["tantrums", "sharing", "night-fears"]
  skillsToReinforce: string[];    // e.g., ["reading", "autonomy", "creativity"]
  emotionalContext: string[];     // e.g., ["new-sibling", "school-change"]
  motivations: string[];          // e.g., ["football", "dance", "science"]
  valuesToTransmit: string[];     // e.g., ["empathy", "perseverance"]
  freeformContext?: string;       // Texto libre adicional del padre/tutor
}

export interface AgentBrief {
  narrativeArc: string;           // Output del Narrative Agent
  storyBeats: Beat[];             // Output del Storytelling Agent
  visualDirections: string[];     // Output del Visual Brief Agent (uno por beat)
}

export interface Persona {
  base64: string;
  desc: string;
  itemImageBase64?: string;       // RENOMBRADO de shoeImageBase64 para ser genérico
  itemDescription?: string;       // Descripción textual del artículo mágico
}

export interface Beat {
  caption?: string;
  dialogue?: string;
  scene: string;
  visualDirection?: string;       // NUEVO: Brief visual del Visual Brief Agent
  choices: string[];
  focus_char: 'hero' | 'friend' | 'other';
}

export interface ComicFace {
  id: string;
  type: 'cover' | 'story' | 'back_cover';
  imageUrl?: string;
  narrative?: Beat;
  choices: string[];
  resolvedChoice?: string;
  isLoading: boolean;
  pageIndex?: number;
  isDecisionPage?: boolean;
}

// Constantes
export const GENRES = ['3D Animation Magic', 'Classic Fairytale', 'Anime Adventure', 'Whimsical Claymation', 'Custom'] as const;
export const LANGUAGES = ['Español', 'English', 'Français', 'Português', 'Italiano'] as const;
export type Genre = typeof GENRES[number];
export type Language = typeof LANGUAGES[number];
```

---

## Configuración de Verticales

### Ejemplo: shoe-store.config.ts

```typescript
// src/config/tenants/shoe-store.config.ts
import { TenantConfig } from '../../types';

export const shoeStoreConfig: TenantConfig = {
  tenantId: 'shoe-store-default',
  tenantName: 'Magic Sneakers',
  verticalId: 'shoe-store',
  itemLabel: 'zapatos',
  itemPlaceholderText: 'Ej: Nike Air Max 90 Kids, color rojo',
  allowUserEditItem: true,
  baseSystemPrompt: `
    Eres un equipo de expertos en neuroeducación, psicología infantil y escritura creativa.
    Tu misión es crear cuentos infantiles donde los ZAPATOS del protagonista tienen poderes mágicos.
    Los zapatos son el elemento central de resolución de conflictos en cada aventura.
    Reglas absolutas:
    - Contenido 100% positivo, sin violencia, sin temas oscuros.
    - Los zapatos SIEMPRE tienen un papel activo en la resolución del problema.
    - Adapt al grupo de edad indicado.
  `,
  brandColors: { primary: '#8B5CF6', accent: '#FBBF24', background: '#FDFBF7' },
  activeLanguages: ['Español', 'English', 'Français', 'Português', 'Italiano'],
  activeGenres: ['3D Animation Magic', 'Classic Fairytale', 'Anime Adventure', 'Whimsical Claymation', 'Custom'],
  pedagogyEnabled: true,
  ragCollections: ['neuro-dev', 'child-psych', 'storytelling'],
};
```

### Ejemplo: fashion-store.config.ts

```typescript
// src/config/tenants/fashion-store.config.ts
import { TenantConfig } from '../../types';

export const fashionStoreConfig: TenantConfig = {
  tenantId: 'fashion-store-default',
  tenantName: 'Magic Wardrobe',
  verticalId: 'fashion-store',
  itemLabel: 'prenda',
  itemPlaceholderText: 'Ej: Abrigo azul marino con capucha de estrellitas',
  allowUserEditItem: true,
  baseSystemPrompt: `
    Eres un equipo de expertos en neuroeducación, psicología infantil y escritura creativa.
    Tu misión es crear cuentos infantiles donde una PRENDA DE ROPA del protagonista tiene poderes mágicos.
    La prenda es el elemento central de resolución de conflictos en cada aventura.
    Reglas absolutas:
    - Contenido 100% positivo, sin violencia, sin temas oscuros.
    - La prenda SIEMPRE tiene un papel activo en la resolución del problema.
    - Adapta al grupo de edad indicado.
  `,
  brandColors: { primary: '#EC4899', accent: '#F59E0B', background: '#FFF9F9' },
  activeLanguages: ['Español', 'English'],
  activeGenres: ['3D Animation Magic', 'Classic Fairytale', 'Whimsical Claymation'],
  pedagogyEnabled: true,
  ragCollections: ['neuro-dev', 'child-psych', 'storytelling'],
};
```

### Carga de Tenant (tenantLoader.ts)

```typescript
// src/config/tenantLoader.ts
// Lee el tenant_id del query param (?tenant=shoe-store-default) o de variable de entorno.
// En producción, este loader haría una llamada a la API para obtener la config del tenant.
// En desarrollo, lee los archivos de config locales.

export async function loadTenantConfig(tenantId?: string): Promise<TenantConfig> {
  const id = tenantId ?? new URLSearchParams(window.location.search).get('tenant') ?? 'direct-b2c';
  
  // En V1: switch local. En V2: fetch('/api/v1/tenants/:id/config')
  switch(id) {
    case 'shoe-store-default': return shoeStoreConfig;
    case 'fashion-store-default': return fashionStoreConfig;
    default: return directB2cConfig;
  }
}
```

---

## Sistema Multiagente: Pseudocódigo y Contratos

### Orchestrator Agent

```typescript
// src/services/agents/orchestratorAgent.ts

/**
 * ORCHESTRATOR AGENT
 * 
 * Rol: Coordinar el pipeline de generación antes de que empiece la generación de páginas.
 * Input: Toda la configuración de la sesión (hero, friend, pedagogy, ageGroup, genre, tenant)
 * Output: AgentBrief completo que guiará todos los generateBeat + generateImage posteriores
 * 
 * Flujo:
 * 1. Consulta RAG con el perfil de la sesión → obtiene chunks relevantes
 * 2. Llama al Narrative Agent con el perfil + chunks RAG
 * 3. Llama al Storytelling Agent con el arco narrativo + AgeGroupConfig
 * 4. Llama al Visual Brief Agent con los beats + genre
 * 5. Retorna AgentBrief completo
 */

async function orchestrate(session: SessionConfig): Promise<AgentBrief> {
  // Paso 1: RAG
  const ragChunks = await ragService.query({
    ageGroup: session.ageGroup,
    pedagogy: session.pedagogyProfile,
    collections: session.tenantConfig.ragCollections,
  });

  // Paso 2: Narrative Agent
  const narrativeArc = await narrativeAgent.generateArc({
    heroName: session.heroName,
    itemLabel: session.tenantConfig.itemLabel,
    itemModel: session.itemModel,
    ageGroup: session.ageGroup,
    pedagogyProfile: session.pedagogyProfile,
    baseSystemPrompt: session.tenantConfig.baseSystemPrompt,
    ragChunks,
  });

  // Paso 3: Storytelling Agent
  const storyBeats = await storytellingAgent.generateBeats({
    narrativeArc,
    ageGroupConfig: AGE_GROUP_CONFIGS[session.ageGroup],
    language: session.language,
    genre: session.genre,
    totalPages: 10,
  });

  // Paso 4: Visual Brief Agent
  const visualDirections = await visualBriefAgent.generateBriefs({
    storyBeats,
    genre: session.genre,
    itemLabel: session.tenantConfig.itemLabel,
  });

  return { narrativeArc, storyBeats, visualDirections };
}
```

### Narrative Agent

```typescript
// src/services/agents/narrativeAgent.ts

/**
 * NARRATIVE AGENT — Rol: Neuroeducador + Psicólogo Infantil
 * 
 * SYSTEM PROMPT MAESTRO:
 * Eres un equipo de dos expertos colaborando:
 * 1. Un neuroeducador especialista en desarrollo cognitivo infantil (Piaget, Vygotsky, Gardner).
 * 2. Un psicólogo infantil experto en inteligencia emocional y bibliotherapy.
 * 
 * Tu tarea es diseñar el ARCO NARRATIVO de un cuento infantil con intención pedagógica.
 * 
 * INPUTS QUE RECIBIRÁS:
 * - Perfil del niño (nombre, grupo de edad, item mágico)
 * - Perfil pedagógico (retos de comportamiento, habilidades a reforzar, contexto emocional)
 * - Chunks relevantes del RAG científico
 * - System prompt base del tenant
 * 
 * OUTPUT ESPERADO (JSON):
 * {
 *   "pedagogicalObjective": "Trabajar la gestión de la frustración ante el fracaso",
 *   "emotionalJourney": "El héroe falla → siente frustración → sus zapatos le recuerdan que puede → lo intenta de nuevo → triunfa",
 *   "coreMessage": "Caerse no es fracasar. Volver a levantarse es la magia real.",
 *   "narrativeArcSummary": "...",
 *   "keyMoments": ["momento_1", "decision_point", "climax", "resolution"]
 * }
 */

async function generateArc(input: NarrativeAgentInput): Promise<string> {
  const prompt = buildNarrativePrompt(input);
  const response = await geminiTextCall(prompt, { expectJson: true });
  return parseJsonSafely(response);
}
```

### Storytelling Agent

```typescript
// src/services/agents/storytellingAgent.ts

/**
 * STORYTELLING AGENT — Rol: Escritor Creativo Infantil
 * 
 * SYSTEM PROMPT MAESTRO:
 * Eres un escritor creativo maestro del storytelling para niños.
 * Tu especialidad es adaptar el vocabulario, el ritmo y la estructura narrativa
 * exactamente al grupo de edad del lector.
 * 
 * REGLAS POR GRUPO DE EDAD:
 * - tiny (3-4 años): Max 20 palabras/página. Frases de sujeto+verbo+complemento simple.
 *   Onomatopeyas. Repetición. Ritmo musical. "¡ZOOM! Los zapatos salieron volando."
 * - little (5-6 años): Max 50 palabras/página. Introduce adjetivos y conectores básicos.
 *   Diálogo simple. Emociones nombradas explícitamente. "Lucía sintió miedo, pero sus zapatos..."
 * - reader (7-10 años): Max 120 palabras/página. Vocabulario rico. Metáforas simples.
 *   Dilemas morales leves. Giros narrativos. Diálogo con subtexto.
 * 
 * Recibirás el arco narrativo del Narrative Agent y deberás convertirlo en N beats concretos.
 * Responde SIEMPRE en JSON estricto. Sin markdown. Sin explicaciones.
 */

// CRÍTICO: Calibrar el prompt según AgeGroupConfig
function buildBeatsPrompt(arc: NarrativeArc, ageGroupConfig: AgeGroupConfig, ...): string {
  return `
    ARCO NARRATIVO: ${arc.narrativeArcSummary}
    OBJETIVO PEDAGÓGICO: ${arc.pedagogicalObjective}
    
    REGLAS DE ESCRITURA (OBLIGATORIAS):
    - Máximo ${ageGroupConfig.maxWordsPerPage} palabras por página
    - Complejidad de frases: ${ageGroupConfig.sentenceComplexity}
    - Estructura narrativa: ${ageGroupConfig.narrativeStructure}
    - Profundidad emocional: ${ageGroupConfig.emotionalDepth}
    
    Genera exactamente 10 beats en este JSON:
    [{ "scene": "...", "caption": "...", "dialogue": "...", "choices": [], "focus_char": "hero" }]
  `;
}
```

### Visual Brief Agent

```typescript
// src/services/agents/visualBriefAgent.ts

/**
 * VISUAL BRIEF AGENT — Rol: Ilustrador Conceptual
 * 
 * Genera el prompt de imagen para cada beat, asegurando:
 * - Consistencia de personajes (REFERENCE 1 = Hero, REFERENCE 2 = Item Mágico)
 * - Coherencia de estilo a lo largo de todo el libro
 * - Brief específico de composición, iluminación y mood por página
 * 
 * Output por beat:
 * {
 *   "compositionNote": "Plano general, niña en primer plano, ciudad mágica al fondo",
 *   "lightingMood": "Luz dorada al atardecer, sombras suaves",
 *   "actionDescription": "La protagonista salta sobre un charco mágico con sus zapatos brillando",
 *   "fullPrompt": "[Prompt completo listo para pasar al modelo de imagen]"
 * }
 */
```

---

## Formulario de Personalización Pedagógica (Modo B)

### Componente PedagogyForm.tsx

```typescript
// src/components/PedagogyForm.tsx
// Formulario colapsable. Solo visible si tenant.pedagogyEnabled = true.

// Estructura de secciones:
const PEDAGOGY_SECTIONS = {
  behaviorChallenges: {
    label: "¿Hay algo que quieras trabajar con el cuento?",
    options: [
      { id: "tantrums",       label: "Gestión de rabietas",          icon: "🌋" },
      { id: "sharing",        label: "Compartir con otros",          icon: "🤝" },
      { id: "night-fears",    label: "Miedos nocturnos",             icon: "🌙" },
      { id: "sibling-rivalry",label: "Celos de hermanos",            icon: "👶" },
      { id: "new-school",     label: "Adaptación al colegio",        icon: "🏫" },
    ]
  },
  skillsToReinforce: {
    label: "¿Qué habilidades quieres potenciar?",
    options: [
      { id: "reading",        label: "Amor por la lectura",          icon: "📚" },
      { id: "autonomy",       label: "Autonomía e independencia",    icon: "⭐" },
      { id: "creativity",     label: "Creatividad",                  icon: "🎨" },
      { id: "problem-solving",label: "Resolución de problemas",      icon: "🧩" },
      { id: "focus",          label: "Concentración",                icon: "🎯" },
    ]
  },
  emotionalContext: {
    label: "¿Está viviendo alguna situación especial?",
    options: [
      { id: "new-sibling",    label: "Llegada de un hermano",        icon: "👶" },
      { id: "moving",         label: "Mudanza o cambio de cole",     icon: "📦" },
      { id: "loss",           label: "Pérdida de un ser querido",    icon: "🌈" },
      { id: "parents-divorce",label: "Separación de los padres",     icon: "💛" },
    ]
  },
  motivations: {
    label: "¿Cuál es su gran pasión o sueño?",
    options: [
      { id: "football",       label: "Fútbol",                       icon: "⚽" },
      { id: "dance",          label: "Baile",                        icon: "💃" },
      { id: "science",        label: "Ciencia y tecnología",         icon: "🚀" },
      { id: "art",            label: "Arte y dibujo",                icon: "🎨" },
      { id: "animals",        label: "Animales y naturaleza",        icon: "🦁" },
    ]
  },
  valuesToTransmit: {
    label: "¿Qué valores quieres que transmita el cuento?",
    options: [
      { id: "empathy",        label: "Empatía",                      icon: "❤️" },
      { id: "perseverance",   label: "Perseverancia",                icon: "💪" },
      { id: "honesty",        label: "Honestidad",                   icon: "✨" },
      { id: "respect",        label: "Respeto a la diversidad",      icon: "🌍" },
      { id: "courage",        label: "Valentía",                     icon: "🦁" },
    ]
  }
};

// El componente renderiza cada sección como un grupo de chips seleccionables.
// Al final, un textarea para contexto adicional libre.
// Integración con usePedagogyForm hook para gestión de estado.
```

---

## Integración del item_model desde Checkout

### Flujo de Inyección

```typescript
// src/config/tenantLoader.ts

// El checkout del tenant embebe el widget con el item en el query param:
// https://stories.nubekids.io/?tenant=shoe-store-acme&item=Nike+Air+Max+90+Kids+Rojo+Talla+32

// tenantLoader lee el item_model del query param
export function getInjectedItemModel(): string | null {
  return new URLSearchParams(window.location.search).get('item');
}

// En Setup.tsx, el campo item_model se pre-rellena con este valor
// Si tenantConfig.allowUserEditItem = true → campo editable
// Si false → campo readonly (solo display)
```

---

## RAG Service (Implementación V1 — Long Context)

```typescript
// src/services/ragService.ts

/**
 * IMPLEMENTACIÓN V1: Usar Gemini Long Context.
 * Los documentos RAG se precargan como contexto del sistema.
 * En V2: migrar a vector DB (Pinecone, Supabase pgvector) para queries semánticas reales.
 * 
 * V1 Strategy:
 * - Mantener N colecciones de chunks en archivos .ts (máx 200k tokens total).
 * - ragService.query() filtra y selecciona chunks relevantes según ageGroup + pedagogyProfile.
 * - Los chunks seleccionados se inyectan en el system prompt del Narrative Agent.
 */

interface RagQuery {
  ageGroup: AgeGroup;
  pedagogy: PedagogyProfile;
  collections: string[];
}

// Los chunks están tipados y taggeados para facilitar el filtrado sin vector search
interface RagChunk {
  id: string;
  collection: string;
  tags: string[];             // ["age:tiny", "topic:night-fears", "technique:bibliotherapy"]
  summary: string;            // 2-3 frases del contenido
  fullContent: string;        // Contenido completo (máx 500 tokens por chunk)
  source: string;             // "Piaget, J. (1952). The Origins of Intelligence in Children."
}

export async function query(params: RagQuery): Promise<RagChunk[]> {
  // V1: filtrado por tags (ageGroup + temas del pedagogy profile)
  // Retorna máx 5 chunks más relevantes para no sobrecargar el contexto
  const relevantTags = buildTagsFromQuery(params);
  return ragChunks
    .filter(chunk => chunk.tags.some(t => relevantTags.includes(t)))
    .slice(0, 5);
}
```

---

## Lista de Tareas de Implementación

### Task 1: Ampliar Types y Constantes
- MODIFICAR `src/types.ts`
- AÑADIR: `TenantConfig`, `VerticalId`, `AgeGroup`, `AgeGroupConfig`, `AGE_GROUP_CONFIGS`, `PedagogyProfile`, `AgentBrief`
- MODIFICAR: `Persona` (renombrar `shoeImageBase64` → `itemImageBase64`)
- MODIFICAR: `Beat` (añadir `visualDirection`)

### Task 2: Crear Configuraciones de Tenant
- CREAR `src/config/tenants/shoe-store.config.ts`
- CREAR `src/config/tenants/fashion-store.config.ts`
- CREAR `src/config/tenants/direct-b2c.config.ts`
- CREAR `src/config/tenantLoader.ts`

### Task 3: Implementar Agentes
- CREAR `src/services/agents/narrativeAgent.ts`
- CREAR `src/services/agents/storytellingAgent.ts`
- CREAR `src/services/agents/visualBriefAgent.ts`
- CREAR `src/services/agents/orchestratorAgent.ts`
- MODIFICAR `src/services/geminiService.ts` para delegar en los agentes

### Task 4: Implementar RAG Service (V1)
- CREAR `src/services/ragService.ts`
- CREAR `src/data/rag/neuro-dev.chunks.ts` (chunks de neuroeducación)
- CREAR `src/data/rag/child-psych.chunks.ts` (chunks de psicología infantil)
- CREAR `src/data/rag/storytelling.chunks.ts` (chunks de escritura creativa)

### Task 5: Nuevos Componentes UI
- CREAR `src/components/AgeGroupSelector.tsx`
- CREAR `src/components/PedagogyForm.tsx`
- CREAR `src/hooks/usePedagogyForm.ts`
- CREAR `src/hooks/useTenantConfig.ts`

### Task 6: Modificar Setup.tsx
- REEMPLAZAR "Novel Mode toggle" por `AgeGroupSelector` (obligatorio)
- AÑADIR campo `item_model` pre-rellenable y opcionalmente editable
- AÑADIR sección collapsable `PedagogyForm` (si `tenantConfig.pedagogyEnabled`)
- AÑADIR campo nombre del protagonista (`heroName`)
- ADAPTAR labels dinámicamente según `tenantConfig.itemLabel`

### Task 7: Modificar App.tsx
- INICIALIZAR `useTenantConfig` al arrancar (lee query param `?tenant=`)
- PASAR `tenantConfig` como prop a Setup y al motor de generación
- INTEGRAR llamada al `orchestratorAgent` antes de la generación de páginas
- USAR `AgentBrief` como contexto para cada `generateBeat` + `generateImage`

### Task 8: Utilidades
- CREAR `src/utils/pdfExport.ts` (extraer de App.tsx)
- CREAR `src/utils/imageUtils.ts` (compresión client-side)

---

## Known Gotchas & Critical Notes

```
# CRÍTICO: Renombrar shoeImageBase64 → itemImageBase64
# En TODOS los lugares donde se usa: geminiService.ts, App.tsx, Setup.tsx, types.ts
# Hacerlo en un único commit para no romper referencias.

# CRÍTICO: Age Group es OBLIGATORIO
# El botón "Start Adventure" debe permanecer deshabilitado si AgeGroup no está seleccionado.
# Es tan obligatorio como la foto del Héroe.

# CRÍTICO: Aislamiento de Tenants en Prompts
# El baseSystemPrompt del tenant NUNCA debe permitir instrucciones que anulen
# las guardrails de contenido infantil. Implementar sanitización del prompt del tenant
# antes de inyectarlo en el system context de los agentes.

# CRÍTICO: JSON Parsing multi-agente
# Cada agente debe devolver JSON estricto. Implementar parseJsonSafely() en utils
# que strip markdown fences y haga JSON.parse en try/catch.
# Nunca confiar en que Gemini devuelva JSON limpio directamente.

# CRÍTICO: El RAG en V1 es simulado con Long Context
# No implementar vector DB en V1. Los chunks se cargan como arrays tipados .ts.
# El ragService filtra por tags, no por embeddings. Esto es suficiente para el MVP.

# GOTCHA: Consistencia de referencias de imagen entre agentes
# El Visual Brief Agent genera el texto del prompt de imagen.
# El geminiService.generateImage() añade las referencias de imagen (inlineData) dinámicamente.
# El brief del Visual Brief Agent NO debe hardcodear "REFERENCE 1" etc.
# Eso lo gestiona siempre generateImage() según qué Personas están disponibles.

# ANTI-PATTERN: No generar el AgentBrief completo en paralelo
# Los agentes DEBEN ejecutarse secuencialmente:
# Orchestrator → Narrative → Storytelling → Visual Brief
# Cada agente depende del output del anterior. No usar Promise.all().

# ANTI-PATTERN: No pasar el PedagogyProfile vacío al Narrative Agent si Modo B está desactivado
# Si pedagogy.enabled = false, pasar null al Narrative Agent.
# El agente tiene instrucciones para generar un cuento estándar inspirador en ese caso.
```

---

## Validation Loop

### Level 1: Syntax & Types

```bash
npm run lint
npx tsc --noEmit
# Expected: 0 errors. Fix all before proceeding.
```

### Level 2: Unit Tests

```typescript
// src/services/agents/__tests__/narrativeAgent.test.ts
describe('narrativeAgent', () => {
  it('genera arco narrativo con objetivo pedagógico cuando pedagogy.enabled = true', async () => {
    const input = { ...mockSession, pedagogyProfile: { enabled: true, behaviorChallenges: ['tantrums'] } };
    const arc = await narrativeAgent.generateArc(input);
    expect(arc.pedagogicalObjective).toBeTruthy();
    expect(arc.emotionalJourney).toBeTruthy();
  });

  it('genera arco estándar inspirador cuando pedagogy.enabled = false', async () => {
    const input = { ...mockSession, pedagogyProfile: { enabled: false } };
    const arc = await narrativeAgent.generateArc(input);
    expect(arc.pedagogicalObjective).toBe('inspiration'); // o similar
  });
});

// src/services/agents/__tests__/storytellingAgent.test.ts
describe('storytellingAgent', () => {
  it('respeta maxWordsPerPage para AgeGroup tiny (20 palabras)', async () => {
    const beats = await storytellingAgent.generateBeats({ ageGroupConfig: AGE_GROUP_CONFIGS.tiny, ... });
    beats.forEach(beat => {
      const wordCount = beat.caption.split(' ').length;
      expect(wordCount).toBeLessThanOrEqual(20);
    });
  });
});

// src/config/__tests__/tenantLoader.test.ts
describe('tenantLoader', () => {
  it('carga la config correcta para shoe-store-default', async () => {
    const config = await loadTenantConfig('shoe-store-default');
    expect(config.itemLabel).toBe('zapatos');
    expect(config.verticalId).toBe('shoe-store');
  });

  it('carga fashion-store con itemLabel prenda', async () => {
    const config = await loadTenantConfig('fashion-store-default');
    expect(config.itemLabel).toBe('prenda');
  });
});
```

```bash
npm run test
# Expected: All passing.
```

### Level 3: Integration Test Manual

```bash
npm run dev

# TEST A — Vertical shoe-store
# 1. Navegar a http://localhost:5173/?tenant=shoe-store-default&item=Nike+Air+Max+Rojo+Talla+32
# 2. Verificar que el campo item_model aparece pre-rellenado con el valor del query param.
# 3. Verificar que los labels dicen "zapatos" (no "prenda").
# 4. Subir foto del Héroe + foto de zapatos.
# 5. Seleccionar Age Group "little" (5-6 años).
# 6. Verificar que "Start Adventure" se activa.
# 7. Completar el formulario pedagógico (seleccionar "Miedos nocturnos" + "Valentía").
# 8. Generar. Verificar en consola que los beats respetan el maxWordsPerPage de "little" (50).
# 9. Verificar que el AgentBrief incluye el objetivo pedagógico en el log.

# TEST B — Vertical fashion-store
# 1. Navegar a http://localhost:5173/?tenant=fashion-store-default
# 2. Verificar que el label del item dice "prenda" (no "zapatos").
# 3. Verificar que los colores de marca son diferentes (pink/rose en lugar de purple).

# TEST C — Age Group tiny
# 1. Seleccionar Age Group "tiny" (3-4 años).
# 2. Generar cuento.
# 3. Verificar que las captions son de máximo 20 palabras.
# 4. Verificar que el tono es muy simple, con onomatopeyas si aplica.

# TEST D — PDF Export
# 1. Completar generación completa.
# 2. Clic en "Download Story".
# 3. Verificar que el PDF incluye todas las páginas en orden correcto.
```

---

## Final Validation Checklist

```
□ npm run lint → 0 errores
□ npx tsc --noEmit → 0 errores de tipo
□ npm run test → todos los tests pasan
□ Vertical shoe-store funciona end-to-end
□ Vertical fashion-store funciona cambiando solo la config (sin tocar lógica)
□ Age Group tiny produce captions ≤ 20 palabras
□ Age Group reader produce captions ≤ 120 palabras
□ Modo B (pedagogy) → el arco narrativo refleja el objetivo pedagógico seleccionado
□ Modo A (sin pedagogy) → el cuento es inspirador y entretenido
□ item_model se inyecta desde query param correctamente
□ item_model es editable si tenant.allowUserEditItem = true
□ AgentBrief completo se genera antes de la primera página
□ JSON parsing robusto en todos los agentes (strip markdown + try/catch)
□ Guardrails de contenido infantil funcionan (prompt del tenant no puede anularlos)
□ PDF export funciona con todas las páginas generadas
□ "Start Adventure" deshabilitado sin Héroe + item_model + AgeGroup
```

---

## Anti-Patterns a Evitar

```
❌ No usar gemini-2.5-flash-image. Usar gemini-3.1-flash-image-preview para imagen multimodal.
❌ No asumir que Gemini devuelve JSON limpio. SIEMPRE strip markdown + try/catch.
❌ No ejecutar los agentes en paralelo (Promise.all). Son secuenciales por diseño.
❌ No almacenar base64 grandes en React state si causan re-renders. Usar refs para historial.
❌ No permitir que el system prompt del tenant anule las guardrails de contenido infantil.
❌ No hardcodear "zapatos" en el código. SIEMPRE usar tenantConfig.itemLabel.
❌ No implementar vector DB en V1. El RAG de filtrado por tags es suficiente para el MVP.
❌ No saltarse el Orchestrator Agent y llamar directamente al Storytelling Agent.
   El flujo de agentes es la garantía de calidad pedagógica.
❌ No olvidar pasar el AgentBrief como contexto a CADA llamada de generateBeat.
   Sin este contexto, los beats se generarán sin coherencia narrativa entre páginas.
```
