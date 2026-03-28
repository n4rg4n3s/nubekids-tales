---
paths:
  - "src/services/ragService.ts"
  - "src/data/rag/**/*.ts"
  - "src/components/PedagogyForm.tsx"
  - "src/hooks/usePedagogyForm.ts"
---

# RAG Pedagógico & Personalización

## RAG V1 — Long Context con Filtrado por Tags

En V1, NO hay vector DB. Los chunks RAG son arrays tipados en archivos `.ts`.
El filtrado es por **tags**, no por embeddings semánticos.

### Estructura de un Chunk RAG

```typescript
interface RagChunk {
  id: string;
  collection: string;           // 'neuro-dev' | 'child-psych' | 'storytelling'
  tags: string[];                // ["age:tiny", "topic:night-fears", "technique:bibliotherapy"]
  summary: string;               // 2-3 frases del contenido
  fullContent: string;           // Máx 500 tokens por chunk
  source: string;                // "Piaget, J. (1952). The Origins of Intelligence..."
}
```

### Colecciones

| ID | Contenido | Uso |
|----|-----------|-----|
| `neuro-dev` | Neuroeducación y desarrollo infantil (Piaget, Vygotsky, Gardner) | Calibrar arco narrativo por edad |
| `child-psych` | Psicología infantil, inteligencia emocional, bibliotherapy | Abordar retos de comportamiento |
| `storytelling` | Storytelling para niños, técnicas de escritura por edad | Calibrar vocabulario y estructura |

### Filtrado por Tags

```typescript
export async function query(params: RagQuery): Promise<RagChunk[]> {
  // Construir tags desde la query
  const relevantTags = [
    `age:${params.ageGroup}`,
    ...params.pedagogy?.behaviorChallenges?.map(c => `topic:${c}`) ?? [],
    ...params.pedagogy?.skillsToReinforce?.map(s => `skill:${s}`) ?? [],
  ];

  return ragChunks
    .filter(chunk => chunk.tags.some(t => relevantTags.includes(t)))
    .slice(0, 5); // Máx 5 chunks para no sobrecargar el contexto
}
```

### Migración a V2 (post-MVP)

```
V1: Chunks .ts → filtrado por tags → inyección en system prompt
V2: Gemini Embeddings (gemini-embedding-001) → pgvector/Pinecone → query semántica

Para V2:
- taskType: 'RETRIEVAL_DOCUMENT' para indexar chunks
- taskType: 'RETRIEVAL_QUERY' para las queries
- output_dimensionality: 768 (balance calidad/coste)
- Normalizar embeddings si dimensión < 3072
```

## Formulario de Personalización Pedagógica

### Secciones del Formulario

```typescript
const PEDAGOGY_SECTIONS = {
  behaviorChallenges: {
    label: "¿Hay algo que quieras trabajar con el cuento?",
    options: [
      { id: "tantrums",        label: "Gestión de rabietas",     icon: "🌋" },
      { id: "sharing",         label: "Compartir con otros",     icon: "🤝" },
      { id: "night-fears",     label: "Miedos nocturnos",        icon: "🌙" },
      { id: "sibling-rivalry", label: "Celos de hermanos",       icon: "👶" },
      { id: "new-school",      label: "Adaptación al colegio",   icon: "🏫" },
    ]
  },
  skillsToReinforce: {
    label: "¿Qué habilidades quieres potenciar?",
    options: [
      { id: "reading",         label: "Amor por la lectura",     icon: "📚" },
      { id: "autonomy",        label: "Autonomía",               icon: "⭐" },
      { id: "creativity",      label: "Creatividad",             icon: "🎨" },
      { id: "problem-solving", label: "Resolución de problemas", icon: "🧩" },
      { id: "focus",           label: "Concentración",           icon: "🎯" },
    ]
  },
  emotionalContext: {
    label: "¿Está viviendo alguna situación especial?",
    options: [
      { id: "new-sibling",     label: "Llegada de un hermano",   icon: "👶" },
      { id: "moving",          label: "Mudanza o cambio de cole", icon: "📦" },
      { id: "loss",            label: "Pérdida de un ser querido", icon: "🌈" },
      { id: "parents-divorce", label: "Separación de los padres", icon: "💛" },
    ]
  },
  motivations: {
    label: "¿Cuál es su gran pasión o sueño?",
    options: [
      { id: "football", label: "Fútbol",     icon: "⚽" },
      { id: "dance",    label: "Baile",       icon: "💃" },
      { id: "science",  label: "Ciencia",     icon: "🚀" },
      { id: "art",      label: "Arte",        icon: "🎨" },
      { id: "animals",  label: "Animales",    icon: "🦁" },
    ]
  },
  valuesToTransmit: {
    label: "¿Qué valores quieres que transmita el cuento?",
    options: [
      { id: "empathy",      label: "Empatía",              icon: "❤️" },
      { id: "perseverance",  label: "Perseverancia",       icon: "💪" },
      { id: "honesty",      label: "Honestidad",           icon: "✨" },
      { id: "respect",      label: "Respeto a la diversidad", icon: "🌍" },
      { id: "courage",      label: "Valentía",             icon: "🦁" },
    ]
  }
};
```

### UX del Formulario

- **Colapsado por defecto** en Setup. Solo visible si `tenantConfig.pedagogyEnabled = true`.
- Cada sección renderiza como **grupo de chips seleccionables** (multi-select).
- Al final: **textarea** para contexto adicional libre (`freeformContext`).
- Integración con `usePedagogyForm` hook para gestión de estado.

### PedagogyProfile → Narrative Agent

```typescript
interface PedagogyProfile {
  enabled: boolean;
  behaviorChallenges: string[];   // ["tantrums", "night-fears"]
  skillsToReinforce: string[];    // ["reading", "autonomy"]
  emotionalContext: string[];     // ["new-sibling"]
  motivations: string[];          // ["football", "science"]
  valuesToTransmit: string[];     // ["empathy", "perseverance"]
  freeformContext?: string;
}

// Si enabled = false → pasar null al Narrative Agent
// Si enabled = true → el Narrative Agent usa TODOS los campos para diseñar el arco
```

## Age Group System

```typescript
export const AGE_GROUP_CONFIGS: Record<AgeGroup, AgeGroupConfig> = {
  tiny:   {
    label: "3-4 años",
    maxWordsPerPage: 20,
    sentenceComplexity: 'simple',
    narrativeStructure: 'linear',
    emotionalDepth: 'basic'
  },
  little: {
    label: "5-6 años",
    maxWordsPerPage: 50,
    sentenceComplexity: 'medium',
    narrativeStructure: 'simple-arc',
    emotionalDepth: 'secondary'
  },
  reader: {
    label: "7-10 años",
    maxWordsPerPage: 120,
    sentenceComplexity: 'rich',
    narrativeStructure: 'complex-arc',
    emotionalDepth: 'nuanced'
  },
};
```

### Age Group es OBLIGATORIO
- Reemplaza el anterior "Novel Mode".
- Botón "Start Adventure" deshabilitado sin selección.
- El Storytelling Agent DEBE respetar `maxWordsPerPage` estrictamente.

## Anti-Patterns

- ❌ No implementar vector DB en V1 — filtrado por tags es suficiente para MVP
- ❌ No cargar más de 5 chunks RAG por sesión — sobrecarga el contexto
- ❌ No pasar PedagogyProfile vacío (con enabled: false) — pasar null
- ❌ No ignorar el Age Group en el Storytelling Agent — es la calibración principal
- ❌ No mezclar tags de colecciones diferentes sin filtrar — mantener coherencia
