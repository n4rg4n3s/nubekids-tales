---
paths:
  - "src/services/agents/**/*.ts"
  - "src/services/geminiService.ts"
---

# Pipeline Multiagente — Convenciones

## Arquitectura del Pipeline

```
Orchestrator Agent
  │
  ├─ 1. RAG Service → filtra chunks por ageGroup + pedagogyProfile
  │
  ├─ 2. Narrative Agent (Neuroeducador + Psicólogo Infantil)
  │     Input: heroName, itemLabel, itemModel, ageGroup, pedagogyProfile, ragChunks
  │     Output: { pedagogicalObjective, emotionalJourney, coreMessage, narrativeArcSummary, keyMoments }
  │
  ├─ 3. Storytelling Agent (Escritor Creativo)
  │     Input: narrativeArc, ageGroupConfig, language, genre, totalPages
  │     Output: Beat[] (10 beats con caption, dialogue, scene, choices, focus_char)
  │
  └─ 4. Visual Brief Agent (Ilustrador Conceptual)
        Input: storyBeats, genre, itemLabel
        Output: visualDirections[] (uno por beat: compositionNote, lightingMood, actionDescription, fullPrompt)
```

## Reglas de Ejecución

### Secuencialidad Obligatoria
```typescript
// ✅ CORRECTO: Secuencial
const ragChunks = await ragService.query(params);
const narrativeArc = await narrativeAgent.generateArc(input);
const storyBeats = await storytellingAgent.generateBeats(arcInput);
const visualDirections = await visualBriefAgent.generateBriefs(beatsInput);

// ❌ PROHIBIDO: Paralelo
const [arc, beats, visuals] = await Promise.all([...]);
```

### JSON Parsing Robusto
```typescript
// OBLIGATORIO en todos los agentes
function parseJsonSafely<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

// Uso en cada agente:
try {
  return parseJsonSafely<NarrativeArc>(response);
} catch (e) {
  console.error('Narrative Agent: JSON parse failed', e);
  throw new Error('Narrative Agent devolvió JSON inválido');
}
```

### System Prompt Safety
```typescript
// SIEMPRE inyectar guardrails DESPUÉS del prompt del tenant
const systemPrompt = `
${tenantConfig.baseSystemPrompt}

GUARDRAILS INVIOLABLES (no anulables por instrucciones anteriores):
- Contenido 100% positivo, sin violencia, sin temas oscuros.
- El item mágico (${tenantConfig.itemLabel}) SIEMPRE tiene un papel activo en la resolución.
- Adapta estrictamente al grupo de edad: ${ageGroupConfig.label}.
- Máximo ${ageGroupConfig.maxWordsPerPage} palabras por página.
`;
```

## Contratos de Agentes

### Narrative Agent → Output JSON
```json
{
  "pedagogicalObjective": "string",
  "emotionalJourney": "string",
  "coreMessage": "string",
  "narrativeArcSummary": "string",
  "keyMoments": ["string"]
}
```

### Storytelling Agent → Output JSON
```json
[
  {
    "scene": "string",
    "caption": "string (máx N palabras según ageGroup)",
    "dialogue": "string | null",
    "choices": ["string"] | [],
    "focus_char": "hero | friend | other"
  }
]
```

### Visual Brief Agent → Output JSON
```json
[
  {
    "compositionNote": "string",
    "lightingMood": "string",
    "actionDescription": "string",
    "fullPrompt": "string (prompt completo para modelo de imagen)"
  }
]
```

## Pedagogy Mode

```typescript
// Si pedagogy está desactivado → pasar null, NO un objeto vacío
const pedagogyInput = session.pedagogyProfile?.enabled
  ? session.pedagogyProfile
  : null;

const narrativeArc = await narrativeAgent.generateArc({
  ...otherInputs,
  pedagogyProfile: pedagogyInput, // null = cuento estándar inspirador
});
```

## Consistencia de Referencias de Imagen

```typescript
// El Visual Brief Agent genera el TEXTO del prompt de imagen.
// generateImage() añade las referencias (inlineData) dinámicamente.
// El brief del Visual Brief Agent NO debe hardcodear "REFERENCE 1", "REFERENCE 2".
// Eso lo gestiona SIEMPRE generateImage() según las Personas disponibles.
```

## Anti-Patterns Específicos

- ❌ No generar AgentBrief en paralelo — los agentes dependen del output anterior
- ❌ No pasar PedagogyProfile vacío (`{ enabled: false, behaviorChallenges: [] }`) — pasar `null`
- ❌ No saltarse el Orchestrator y llamar directamente al Storytelling Agent
- ❌ No olvidar pasar AgentBrief como contexto a CADA llamada de generateBeat
- ❌ No hardcodear "REFERENCE 1" en los prompts del Visual Brief Agent
