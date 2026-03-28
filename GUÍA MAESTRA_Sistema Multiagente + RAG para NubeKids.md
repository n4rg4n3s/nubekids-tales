Perfecto, he analizado toda la documentación del repositorio RAG Agent que compartiste. Es **extremadamente valiosa** para NubeKids Fase 3. Voy a crear un documento de guía/mapa mental que unifique lo mejor de ambos mundos.

---

# 🗺️ GUÍA MAESTRA: Sistema Multiagente + RAG para NubeKids

> **Documento de consulta rápida para implementar Fase 3**  
> Combina: PRP v2 de NubeKids + Arquitectura probada del RAG Agent

---

## 📊 Mapa Mental de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR AGENT                        │
│  (Coordina todo el flujo antes de generar páginas)         │
└────────────────┬────────────────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
┌──────────┐         ┌──────────────┐
│   RAG    │         │ Session Data │
│ Service  │         │ (Age, Peda)  │
└────┬─────┘         └──────┬───────┘
     │                      │
     └──────────┬───────────┘
                ▼
    ┌───────────────────────┐
    │  NARRATIVE AGENT      │
    │  (Neuroeducador +     │
    │   Psicólogo Infantil) │
    └──────────┬────────────┘
               │
               ▼
    ┌───────────────────────┐
    │  STORYTELLING AGENT   │
    │  (Escritor Creativo)  │
    │  Calibra por AgeGroup │
    └──────────┬────────────┘
               │
               ▼
    ┌───────────────────────┐
    │ VISUAL BRIEF AGENT    │
    │ (Ilustrador)          │
    │ Genera prompts imagen │
    └──────────┬────────────┘
               │
               ▼
        ┌─────────────┐
        │ AgentBrief  │
        │  completo   │
        └─────────────┘
```

---

## 🎯 Principios Clave (Del RAG Agent)

### 1. **Tools como funciones puras**
```typescript
// ✅ CORRECTO (del RAG Agent)
@agent.tool
async function semantic_search(
  ctx: RunContext[AgentDependencies],
  query: string,
  limit: int = 10
) -> List[SearchResult]

// ❌ INCORRECTO
// No hacer: tool que modifica estado global
// No hacer: tool que depende de orden de ejecución
```

### 2. **Parsing JSON robusto**
```typescript
// Basado en RAG Agent utils
function parseJsonSafely(response: string): any {
  // 1. Strip markdown fences
  let clean = response.replace(/```json|```/g, '').trim();
  
  // 2. Try parse
  try {
    return JSON.parse(clean);
  } catch (e) {
    // 3. Log and retry with more aggressive cleaning
    console.error('JSON parse failed:', e);
    // Intentar extraer JSON con regex
    const jsonMatch = clean.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON found in response');
  }
}
```

### 3. **Dependencies como dataclass**
```typescript
// Patrón del RAG Agent - MUY LIMPIO
@dataclass
export class AgentDependencies {
  // External services
  db_pool?: asyncpg.Pool;
  openai_client?: OpenAI;
  settings?: Settings;
  
  // Session context
  session_id?: string;
  user_preferences: Record<string, any> = {};
  query_history: string[] = [];
  
  async initialize() { /* setup */ }
  async cleanup() { /* teardown */ }
}
```

---

## 📋 Estructura de Archivos Recomendada

```
src/
├── services/
│   ├── geminiService.ts          # MODIFICAR: Delega a agents/
│   ├── agents/
│   │   ├── orchestratorAgent.ts  # CREAR
│   │   ├── narrativeAgent.ts     # CREAR
│   │   ├── storytellingAgent.ts  # CREAR
│   │   └── visualBriefAgent.ts   # CREAR
│   ├── ragService.ts             # CREAR
│   └── dependencies.ts           # CREAR (como RAG Agent)
├── data/
│   └── rag/
│       ├── neuro-dev.chunks.ts   # CREAR
│       ├── child-psych.chunks.ts # CREAR
│       └── storytelling.chunks.ts# CREAR
└── utils/
    └── jsonParser.ts             # CREAR (parseJsonSafely)
```

---

## 🔧 Implementación Paso a Paso

### **FASE 3A: Dependencies + RAG (Sin agentes aún)**

#### 1. Crear `dependencies.ts`
```typescript
// Inspirado en RAG Agent dependencies.py
import { GoogleGenerativeAI } from '@google/genai';

export class AgentDependencies {
  geminiClient?: GoogleGenerativeAI;
  settings?: Settings;
  
  // Session context
  sessionId?: string;
  ageGroup?: AgeGroup;
  pedagogyProfile?: PedagogyProfile;
  heroName?: string;
  itemModel?: string;
  
  // RAG cache
  ragChunks: RagChunk[] = [];
  
  async initialize() {
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenerativeAI(
        import.meta.env.VITE_GEMINI_API_KEY
      );
    }
  }
  
  async cleanup() {
    // Limpiar recursos si es necesario
  }
}
```

#### 2. Crear `ragService.ts` (V1 - Sin vector DB)
```typescript
// Basado en RAG Agent ragService.ts
interface RagChunk {
  id: string;
  collection: string;
  tags: string[];  // ["age:tiny", "topic:night-fears"]
  summary: string;
  fullContent: string;
  source: string;
}

interface RagQuery {
  ageGroup: AgeGroup;
  pedagogy?: PedagogyProfile;
  collections: string[];
}

export async function query(params: RagQuery): Promise<RagChunk[]> {
  // V1: Filtrado simple por tags
  const relevantTags = buildTagsFromQuery(params);
  
  return ragChunks
    .filter(chunk => 
      chunk.tags.some(t => relevantTags.includes(t))
    )
    .slice(0, 5); // Máximo 5 chunks
}

function buildTagsFromQuery(params: RagQuery): string[] {
  const tags: string[] = [];
  
  // Tag por edad
  tags.push(`age:${params.ageGroup}`);
  
  // Tags por pedagogía
  if (params.pedagogy?.enabled) {
    params.pedagogy.behaviorChallenges?.forEach(challenge => {
      tags.push(`topic:${challenge}`);
    });
  }
  
  return tags;
}
```

#### 3. Crear chunks de RAG (ejemplo)
```typescript
// src/data/rag/neuro-dev.chunks.ts
export const neuroDevChunks: RagChunk[] = [
  {
    id: 'neuro-1',
    collection: 'neuro-dev',
    tags: ['age:tiny', 'topic:tantrums', 'technique:emotion-naming'],
    summary: 'A los 3-4 años, los niños carecen de vocabulario emocional completo.',
    fullContent: `
      Los niños de 3-4 años experimentan emociones intensas pero carecen del 
      vocabulario para expresarlas. Nombrar las emociones en cuentos ayuda a:
      1. Desarrollar conciencia emocional
      2. Proveer lenguaje para futuras situaciones
      3. Normalizar sentimientos difíciles
      
      Técnica narrativa: Usar frases como "El héroe se sintió frustrado porque..."
    `,
    source: 'Piaget, J. (1952). The Origins of Intelligence in Children.'
  },
  // ... más chunks
];
```

---

### **FASE 3B: Primer Agente (Storytelling)**

#### 4. Crear `storytellingAgent.ts`
```typescript
// Inspirado en tools.py del RAG Agent
import { GoogleGenerativeAI } from '@google/genai';

interface StorytellingInput {
  narrativeArc: string;
  ageGroupConfig: AgeGroupConfig;
  language: Language;
  genre: Genre;
  totalPages: number;
}

export async function generateBeats(
  input: StorytellingInput,
  deps: AgentDependencies
): Promise<Beat[]> {
  const prompt = buildBeatsPrompt(input);
  
  const model = deps.geminiClient!.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: STORYTELLING_SYSTEM_PROMPT
  });
  
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Parsing robusto (del RAG Agent)
  const beats = parseJsonSafely(responseText);
  
  // Validar que respeta maxWordsPerPage
  validateBeats(beats, input.ageGroupConfig);
  
  return beats;
}

function buildBeatsPrompt(input: StorytellingInput): string {
  const { ageGroupConfig } = input;
  
  return `
ARCO NARRATIVO: ${input.narrativeArc}

REGLAS OBLIGATORIAS:
- Máximo ${ageGroupConfig.maxWordsPerPage} palabras por página
- Complejidad de frases: ${ageGroupConfig.sentenceComplexity}
- Estructura narrativa: ${ageGroupConfig.narrativeStructure}

Genera exactamente ${input.totalPages} beats en JSON:
[
  {
    "scene": "...",
    "caption": "...",
    "dialogue": "...",
    "choices": [],
    "focus_char": "hero"
  }
]

RESPONDE SOLO CON JSON. Sin markdown, sin explicaciones.
  `;
}

function validateBeats(beats: Beat[], config: AgeGroupConfig) {
  beats.forEach((beat, idx) => {
    const wordCount = beat.caption?.split(' ').length || 0;
    if (wordCount > config.maxWordsPerPage) {
      throw new Error(
        `Beat ${idx} tiene ${wordCount} palabras (máx: ${config.maxWordsPerPage})`
      );
    }
  });
}
```

---

### **FASE 3C: Narrative Agent + Orchestrator**

#### 5. Crear `narrativeAgent.ts`
```typescript
// Similar estructura a storytellingAgent pero con RAG
export async function generateArc(
  input: NarrativeAgentInput,
  deps: AgentDependencies
): Promise<NarrativeArc> {
  const prompt = buildNarrativePrompt(input, deps.ragChunks);
  
  const model = deps.geminiClient!.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: NARRATIVE_SYSTEM_PROMPT
  });
  
  const result = await model.generateContent(prompt);
  return parseJsonSafely(result.response.text());
}

function buildNarrativePrompt(
  input: NarrativeAgentInput,
  ragChunks: RagChunk[]
): string {
  // Inyectar chunks RAG en el prompt
  const ragContext = ragChunks
    .map(chunk => `[${chunk.source}]: ${chunk.fullContent}`)
    .join('\n\n');
  
  return `
CONTEXTO CIENTÍFICO:
${ragContext}

PERFIL DEL NIÑO:
- Nombre: ${input.heroName}
- Edad: ${input.ageGroup}
- Item mágico: ${input.itemModel}
${input.pedagogyProfile?.enabled ? `
- Retos de comportamiento: ${input.pedagogyProfile.behaviorChallenges.join(', ')}
- Valores a transmitir: ${input.pedagogyProfile.valuesToTransmit.join(', ')}
` : ''}

Diseña el ARCO NARRATIVO en JSON:
{
  "pedagogicalObjective": "...",
  "emotionalJourney": "...",
  "coreMessage": "...",
  "narrativeArcSummary": "...",
  "keyMoments": ["...", "..."]
}
  `;
}
```

#### 6. Crear `orchestratorAgent.ts`
```typescript
// Patron del RAG Agent: Coordinar todo ANTES de páginas
export async function orchestrate(
  session: SessionConfig,
  deps: AgentDependencies
): Promise<AgentBrief> {
  // Paso 1: RAG
  deps.ragChunks = await ragService.query({
    ageGroup: session.ageGroup,
    pedagogy: session.pedagogyProfile,
    collections: session.tenantConfig.ragCollections
  });
  
  // Paso 2: Narrative Agent
  const narrativeArc = await narrativeAgent.generateArc({
    heroName: session.heroName,
    itemModel: session.itemModel,
    ageGroup: session.ageGroup,
    pedagogyProfile: session.pedagogyProfile,
    baseSystemPrompt: session.tenantConfig.baseSystemPrompt
  }, deps);
  
  // Paso 3: Storytelling Agent
  const storyBeats = await storytellingAgent.generateBeats({
    narrativeArc: narrativeArc.narrativeArcSummary,
    ageGroupConfig: AGE_GROUP_CONFIGS[session.ageGroup],
    language: session.language,
    genre: session.genre,
    totalPages: 10
  }, deps);
  
  // Paso 4: Visual Brief Agent
  const visualDirections = await visualBriefAgent.generateBriefs({
    storyBeats,
    genre: session.genre,
    itemLabel: session.tenantConfig.itemLabel
  }, deps);
  
  return {
    narrativeArc: narrativeArc.narrativeArcSummary,
    storyBeats,
    visualDirections
  };
}
```

---

## 🧪 Testing Strategy (Del RAG Agent)

```typescript
// Patrón del RAG Agent: TestModel para iterar rápido
describe('Storytelling Agent', () => {
  it('respeta maxWordsPerPage para tiny', async () => {
    const beats = await storytellingAgent.generateBeats({
      narrativeArc: 'Test arc',
      ageGroupConfig: AGE_GROUP_CONFIGS.tiny,
      // ...
    }, mockDeps);
    
    beats.forEach(beat => {
      const wordCount = beat.caption.split(' ').length;
      expect(wordCount).toBeLessThanOrEqual(20);
    });
  });
});
```

---

## ⚠️ Gotchas Críticos (Lecciones del RAG Agent)

### 1. **JSON Parsing siempre falla**
```typescript
// ❌ NUNCA hacer esto
const beats = JSON.parse(response.text());

// ✅ SIEMPRE usar parsing robusto
const beats = parseJsonSafely(response.text());
```

### 2. **Agentes DEBEN ser secuenciales**
```typescript
// ❌ NO HACER
const [arc, beats] = await Promise.all([
  narrativeAgent.generateArc(),
  storytellingAgent.generateBeats() // ¡No tiene el arc aún!
]);

// ✅ CORRECTO
const arc = await narrativeAgent.generateArc();
const beats = await storytellingAgent.generateBeats({ narrativeArc: arc });
```

### 3. **RAG V1 es suficiente**
```typescript
// NO implementar vector DB en V1
// Filtrado por tags es SUFICIENTE para MVP
const chunks = ragChunks.filter(chunk =>
  chunk.tags.some(t => relevantTags.includes(t))
);
```

---

## 📊 Checklist de Implementación

```
FASE 3A - Fundamentos:
□ AgentDependencies creado
□ ragService.ts creado (filtrado por tags)
□ Chunks RAG creados (mínimo 10 por colección)
□ parseJsonSafely implementado

FASE 3B - Primer Agente:
□ storytellingAgent.ts funcional
□ Validación de maxWordsPerPage
□ Tests unitarios pasando
□ Genera 10 beats correctamente

FASE 3C - Sistema Completo:
□ narrativeAgent.ts con RAG
□ visualBriefAgent.ts
□ orchestratorAgent.ts
□ Flujo completo end-to-end funciona

FASE 3D - Integración:
□ App.tsx llama orchestrator
□ AgentBrief se pasa a generateImage
□ Consistencia de imágenes verificada
```

---

## 🎓 Recursos de Consulta Rápida

| Duda sobre... | Ver archivo del RAG Agent |
|---------------|---------------------------|
| Cómo estructurar tools | `tools.py` |
| Parsing JSON robusto | `utils/` ejemplos |
| Dependencies pattern | `dependencies.py` |
| Testing con mocks | `tests/test_tools.py` |
| RAG sin vector DB | `ragService.ts` concepto |

---

**¿Quieres que profundice en alguna sección específica o empezamos con Fase 3A?**