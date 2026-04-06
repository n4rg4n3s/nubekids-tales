# 🗺️ GUÍA MAESTRA V2: Sistema Multiagente + RAG para NubeKids

> **Versión:** 2.0  
> **Fecha:** 2026-03-27  
> **Estado:** Listo para implementar Fase 3

---

## Nota de Evolución

Esta guía describe la arquitectura base del sistema multiagente. Desde el 04/04/2026, el SaaS ya no debe interpretar `shoe-store` y `fashion-store` como categorías narrativas de producto.

Regla actual:

- `tenant` = identidad comercial / branding
- `itemInteractionMode` = cómo se relaciona el niño con el objeto en narrativa e imagen

Asignación actual en producción:

- `shoe-store-default` → `wearable`
- `fashion-store-default` → `wearable`
- `direct-b2c` → `generic`

Las URLs legacy con `?tenant=shoe-store-default` y `?tenant=fashion-store-default` se mantienen por compatibilidad.

---

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR AGENT                        │
│  (Coordina todo el flujo ANTES de generar páginas)          │
└────────────────┬────────────────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
┌──────────┐         ┌──────────────┐
│   RAG    │         │ Session Data │
│ Service  │         │ (SetupData)  │
└────┬─────┘         └──────┬───────┘
     │                      │
     └──────────┬───────────┘
                ▼
    ┌───────────────────────┐
    │  NARRATIVE AGENT      │
    │  (Neuroeducador +     │
    │   Psicólogo Infantil) │
    │  Output: NarrativeArc │
    └──────────┬────────────┘
               │
               ▼
    ┌───────────────────────┐
    │  STORYTELLING AGENT   │
    │  (Escritor Creativo)  │
    │  Calibra por AgeGroup │
    │  Output: Beat[]       │
    └──────────┬────────────┘
               │
               ▼
    ┌───────────────────────┐
    │ VISUAL BRIEF AGENT    │
    │ (Ilustrador)          │
    │ Output: string[]      │
    │ (prompts de imagen)   │
    └──────────┬────────────┘
               │
               ▼
        ┌─────────────┐
        │ AgentBrief  │
        │  completo   │
        └──────┬──────┘
               │
               ▼
    ┌───────────────────────┐
    │ GENERACIÓN DE PÁGINAS │
    │ (generateBeat +       │
    │  generateImage)       │
    │ Usa AgentBrief como   │
    │ contexto por página   │
    └───────────────────────┘
```

---

## 🔧 Estructura de Archivos

```
src/
├── services/
│   ├── geminiService.ts          # MODIFICAR: Integrar orchestrator
│   ├── agents/
│   │   ├── index.ts              # Re-exports
│   │   ├── orchestratorAgent.ts  # CREAR
│   │   ├── narrativeAgent.ts     # CREAR
│   │   ├── storytellingAgent.ts  # CREAR
│   │   └── visualBriefAgent.ts   # CREAR
│   ├── ragService.ts             # CREAR
│   └── dependencies.ts           # CREAR
│
├── utils/
│   ├── itemInteraction.ts        # NUEVO: semántica narrativa/visual del objeto
│   └── jsonParser.ts             # CREAR
│
├── data/
│   └── rag/
│       ├── index.ts              # Exporta todos los chunks
│       ├── neuro-dev.chunks.ts   # CREAR
│       ├── child-psych.chunks.ts # CREAR
│       └── storytelling.chunks.ts# CREAR
│
```

Nota:

- En la implementación actual, cualquier lógica nueva que cambie cómo aparece o se usa el objeto mágico debe apoyarse en `itemInteractionMode`, no en `verticalId` ni en el nombre del tenant.

---

## 📋 Implementación Paso a Paso

### FASE 3A: Cimientos (Sin agentes aún)

#### 1. `src/utils/jsonParser.ts`

```typescript
/**
 * Parsing robusto de JSON desde respuestas de Gemini.
 * Gemini NUNCA devuelve JSON limpio - siempre hay markdown, espacios, etc.
 */

export function parseJsonSafely<T>(response: string): T {
  // 1. Strip markdown fences
  let clean = response
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  
  // 2. Intentar parse directo
  try {
    return JSON.parse(clean);
  } catch (e) {
    // 3. Intentar extraer JSON con regex
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        // Continuar al siguiente intento
      }
    }
    
    // 4. Intentar extraer array
    const arrayMatch = clean.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (e3) {
        // Continuar
      }
    }
    
    // 5. Log y throw
    console.error('JSON parse failed. Original response:', response);
    console.error('Cleaned response:', clean);
    throw new Error('No valid JSON found in response');
  }
}

/**
 * Valida que un objeto tenga las propiedades requeridas
 */
export function validateRequired<T>(
  obj: T, 
  requiredKeys: (keyof T)[]
): void {
  for (const key of requiredKeys) {
    if (obj[key] === undefined || obj[key] === null) {
      throw new Error(`Missing required field: ${String(key)}`);
    }
  }
}
```

---

#### 2. `src/services/dependencies.ts`

```typescript
/**
 * Dependencias centralizadas para todos los agentes.
 * Patrón inspirado en el RAG Agent de referencia.
 */

import { GoogleGenAI } from '@google/genai';
import type { 
  AgeGroup, 
  PedagogyProfile, 
  TenantConfig,
  RagChunk,
  Genre,
  Language
} from '../types';

export interface SessionContext {
  // Tenant
  tenantConfig: TenantConfig;
  
  // Protagonista
  heroName: string;
  heroDescription: string | null;
  heroPhoto: string | null;
  
  // Objeto mágico
  itemImage: string | null;
  itemDescription: string;
  
  // Configuración
  ageGroup: AgeGroup;
  language: Language;
  genre: Genre;
  
  // Pedagogía
  pedagogyProfile: PedagogyProfile;
}

export class AgentDependencies {
  // Cliente de Gemini
  private _geminiClient: GoogleGenAI | null = null;
  
  // Contexto de sesión
  session: SessionContext | null = null;
  
  // Cache de RAG
  ragChunks: RagChunk[] = [];
  
  // Getters
  get geminiClient(): GoogleGenAI {
    if (!this._geminiClient) {
      throw new Error('Gemini client not initialized. Call initialize() first.');
    }
    return this._geminiClient;
  }
  
  // Inicialización
  async initialize(apiKey: string): Promise<void> {
    this._geminiClient = new GoogleGenAI({ apiKey });
  }
  
  // Setear contexto de sesión desde SetupData
  setSession(context: SessionContext): void {
    this.session = context;
  }
  
  // Limpiar al terminar
  cleanup(): void {
    this.session = null;
    this.ragChunks = [];
  }
}

// Singleton para uso global
export const agentDeps = new AgentDependencies();
```

---

#### 3. `src/services/ragService.ts` (V1 - Tags)

```typescript
/**
 * RAG Service V1 - Filtrado por tags.
 * Sin vector DB, suficiente para MVP.
 * 
 * V2: Migrar a Supabase pgvector + gemini-embedding-001
 */

import type { AgeGroup, PedagogyProfile, RagChunk } from '../types';
import { allChunks } from '../data/rag';

export interface RagQuery {
  ageGroup: AgeGroup;
  pedagogy?: PedagogyProfile;
  collections?: string[];
  maxChunks?: number;
}

export async function queryRag(params: RagQuery): Promise<RagChunk[]> {
  const { ageGroup, pedagogy, collections, maxChunks = 5 } = params;
  
  // Construir tags relevantes
  const relevantTags = buildTagsFromQuery(ageGroup, pedagogy);
  
  // Filtrar chunks
  let filtered = allChunks;
  
  // Filtrar por colección si se especifica
  if (collections && collections.length > 0) {
    filtered = filtered.filter(chunk => 
      collections.includes(chunk.collection)
    );
  }
  
  // Filtrar por tags (al menos un tag debe coincidir)
  filtered = filtered.filter(chunk =>
    chunk.tags.some(tag => relevantTags.includes(tag))
  );
  
  // Ordenar por relevancia (más tags coincidentes = más relevante)
  filtered.sort((a, b) => {
    const aMatches = a.tags.filter(t => relevantTags.includes(t)).length;
    const bMatches = b.tags.filter(t => relevantTags.includes(t)).length;
    return bMatches - aMatches;
  });
  
  // Limitar resultados
  return filtered.slice(0, maxChunks);
}

function buildTagsFromQuery(
  ageGroup: AgeGroup, 
  pedagogy?: PedagogyProfile
): string[] {
  const tags: string[] = [];
  
  // Tag por edad
  tags.push(`age:${ageGroup}`);
  tags.push('age:all'); // Chunks aplicables a todas las edades
  
  // Tags por pedagogía
  if (pedagogy?.enabled) {
    pedagogy.behaviorChallenges?.forEach(challenge => {
      tags.push(`topic:${challenge}`);
    });
    pedagogy.skillsToReinforce?.forEach(skill => {
      tags.push(`skill:${skill}`);
    });
    pedagogy.emotionalContext?.forEach(context => {
      tags.push(`emotion:${context}`);
    });
    pedagogy.valuesToTransmit?.forEach(value => {
      tags.push(`value:${value}`);
    });
  }
  
  return tags;
}

/**
 * Formatea chunks para inyectar en el prompt de un agente
 */
export function formatChunksForPrompt(chunks: RagChunk[]): string {
  if (chunks.length === 0) return '';
  
  return chunks
    .map(chunk => `[${chunk.source}]:\n${chunk.fullContent}`)
    .join('\n\n---\n\n');
}
```

---

#### 4. `src/data/rag/index.ts` (Exportador)

```typescript
/**
 * Exporta todos los chunks RAG.
 * V1: Hardcodeados en archivos .ts
 * V2: Cargados desde Supabase pgvector
 */

import { neuroDevChunks } from './neuro-dev.chunks';
import { childPsychChunks } from './child-psych.chunks';
import { storytellingChunks } from './storytelling.chunks';
import type { RagChunk } from '../../types';

export const allChunks: RagChunk[] = [
  ...neuroDevChunks,
  ...childPsychChunks,
  ...storytellingChunks,
];

export { neuroDevChunks, childPsychChunks, storytellingChunks };
```

---

#### 5. Ejemplo: `src/data/rag/neuro-dev.chunks.ts`

```typescript
/**
 * Chunks de Neuroeducación y Desarrollo Infantil.
 * Fuentes: Piaget, Vygotsky, Gardner, investigación moderna.
 * 
 * NOTA: Estos son chunks de ejemplo/placeholder.
 * Reemplazar con contenido real de los PDFs procesados.
 */

import type { RagChunk } from '../../types';

export const neuroDevChunks: RagChunk[] = [
  {
    id: 'neuro-001',
    collection: 'neuro-dev',
    tags: ['age:tiny', 'topic:tantrums', 'technique:emotion-naming'],
    summary: 'Los niños de 3-4 años necesitan vocabulario emocional.',
    fullContent: `
Los niños de 3-4 años experimentan emociones intensas pero carecen del 
vocabulario para expresarlas. La técnica de "nombrar emociones" en cuentos:

1. Desarrolla conciencia emocional temprana
2. Provee lenguaje para situaciones futuras
3. Normaliza sentimientos difíciles

TÉCNICA NARRATIVA: Usar frases explícitas como "Luna se sintió frustrada 
porque no podía alcanzar la estrella. Su corazón latía rápido y sus manos 
se apretaban." Esto modela tanto la emoción como las sensaciones físicas.
    `.trim(),
    source: 'Piaget, J. (1952). The Origins of Intelligence in Children.'
  },
  {
    id: 'neuro-002',
    collection: 'neuro-dev',
    tags: ['age:little', 'topic:sharing', 'technique:perspective-taking'],
    summary: 'A los 5-6 años emerge la capacidad de ver perspectivas ajenas.',
    fullContent: `
Entre los 5-6 años, los niños comienzan a desarrollar "teoría de la mente" - 
la capacidad de entender que otros tienen pensamientos y sentimientos 
diferentes a los suyos.

TÉCNICA NARRATIVA: Incluir escenas donde el protagonista descubre cómo 
se siente otro personaje. Ejemplo: "Cuando sus zapatos mágicos brillaron, 
Pablo pudo ver que Ana estaba triste porque nadie quería jugar con ella."

Esto refuerza:
- Empatía cognitiva
- Resolución de conflictos sociales
- Motivación intrínseca para compartir
    `.trim(),
    source: 'Vygotsky, L.S. (1978). Mind in Society.'
  },
  {
    id: 'neuro-003',
    collection: 'neuro-dev',
    tags: ['age:reader', 'topic:problem-solving', 'technique:metacognition'],
    summary: 'Los 7-10 años es ideal para introducir pensamiento metacognitivo.',
    fullContent: `
Los niños de 7-10 años pueden beneficiarse de narrativas que modelen 
el proceso de pensamiento, no solo el resultado.

TÉCNICA NARRATIVA: El protagonista "piensa en voz alta" antes de actuar.
Ejemplo: "Marcos se detuvo a pensar. Tenía tres opciones: podía correr, 
podía esconderse, o podía usar sus zapatillas mágicas para volar. 
Cada opción tenía consecuencias diferentes..."

Esto desarrolla:
- Planificación antes de actuar
- Evaluación de consecuencias
- Flexibilidad cognitiva
    `.trim(),
    source: 'Flavell, J.H. (1979). Metacognition and Cognitive Monitoring.'
  },
  // ... más chunks
];
```

---

### FASE 3B: Agentes (Uno a uno)

#### 6. `src/services/agents/storytellingAgent.ts`

```typescript
/**
 * STORYTELLING AGENT — Rol: Escritor Creativo Infantil
 * 
 * Convierte el arco narrativo en beats concretos,
 * calibrando vocabulario y estructura según AgeGroup.
 */

import type { Beat, AgeGroup, AgeGroupConfig, Language, Genre } from '../../types';
import { AGE_GROUP_CONFIGS } from '../../types';
import { AgentDependencies } from '../dependencies';
import { parseJsonSafely } from '../../utils/jsonParser';

const SYSTEM_PROMPT = `
Eres un escritor creativo maestro del storytelling para niños.
Tu especialidad es adaptar vocabulario, ritmo y estructura narrativa 
exactamente al grupo de edad del lector.

REGLAS ABSOLUTAS:
- Contenido 100% positivo, sin violencia, sin temas oscuros
- El objeto mágico SIEMPRE tiene un papel activo en la resolución
- Respeta ESTRICTAMENTE el límite de palabras por página
- Responde SOLO con JSON válido, sin markdown, sin explicaciones

CALIBRACIÓN POR EDAD:
- tiny (3-4 años): Frases sujeto+verbo+complemento. Onomatopeyas. Repetición.
- little (5-6 años): Adjetivos y conectores básicos. Diálogo simple. Emociones nombradas.
- reader (7-10 años): Vocabulario rico. Metáforas simples. Dilemas morales leves.
`;

export interface StorytellingInput {
  narrativeArc: string;
  ageGroup: AgeGroup;
  language: Language;
  genre: Genre;
  heroName: string;
  itemLabel: string;
  totalPages?: number;
}

export async function generateBeats(
  input: StorytellingInput,
  deps: AgentDependencies
): Promise<Beat[]> {
  const ageGroupConfig = AGE_GROUP_CONFIGS[input.ageGroup];
  const totalPages = input.totalPages || 10;
  
  const prompt = buildPrompt(input, ageGroupConfig, totalPages);
  
  const response = await deps.geminiClient.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.8, // Creatividad alta pero controlada
    }
  });
  
  const responseText = response.text || '';
  const beats = parseJsonSafely<Beat[]>(responseText);
  
  // Validar que respeta límites
  validateBeats(beats, ageGroupConfig);
  
  return beats;
}

function buildPrompt(
  input: StorytellingInput,
  config: AgeGroupConfig,
  totalPages: number
): string {
  return `
ARCO NARRATIVO A DESARROLLAR:
${input.narrativeArc}

CONFIGURACIÓN:
- Protagonista: ${input.heroName}
- Objeto mágico: ${input.itemLabel}
- Idioma: ${input.language}
- Estilo visual: ${input.genre}

REGLAS DE ESCRITURA (OBLIGATORIAS):
- Máximo ${config.maxWordsPerPage} palabras por página
- Complejidad de frases: ${config.sentenceComplexity}
- Estructura narrativa: ${config.narrativeStructure}
- Profundidad emocional: ${config.emotionalDepth}

Genera exactamente ${totalPages} beats en este formato JSON:
[
  {
    "scene": "Descripción visual de la escena para el ilustrador",
    "caption": "Texto narrativo que aparece en la página (máx ${config.maxWordsPerPage} palabras)",
    "dialogue": "Diálogo del personaje si lo hay, o null",
    "choices": [],
    "focus_char": "hero"
  }
]

IMPORTANTE:
- El beat 1 es la introducción (presentar al héroe)
- El beat 5-6 es el punto de decisión (añadir 2 opciones en "choices")
- El beat ${totalPages} es la resolución positiva
- focus_char puede ser "hero", "friend", o "other"
  `.trim();
}

function validateBeats(beats: Beat[], config: AgeGroupConfig): void {
  beats.forEach((beat, idx) => {
    const wordCount = (beat.caption || '').split(/\s+/).filter(Boolean).length;
    if (wordCount > config.maxWordsPerPage) {
      console.warn(
        `Beat ${idx + 1} tiene ${wordCount} palabras (máx: ${config.maxWordsPerPage}). ` +
        `Será truncado.`
      );
      // Podríamos truncar aquí o lanzar error
    }
  });
}
```

---

#### 7. `src/services/agents/narrativeAgent.ts`

```typescript
/**
 * NARRATIVE AGENT — Rol: Neuroeducador + Psicólogo Infantil
 * 
 * Diseña el arco narrativo con intención pedagógica,
 * usando contexto del RAG científico.
 */

import type { AgeGroup, PedagogyProfile } from '../../types';
import { AgentDependencies } from '../dependencies';
import { formatChunksForPrompt } from '../ragService';
import { parseJsonSafely } from '../../utils/jsonParser';

const SYSTEM_PROMPT = `
Eres un equipo de dos expertos colaborando:
1. Un neuroeducador especialista en desarrollo cognitivo infantil (Piaget, Vygotsky, Gardner).
2. Un psicólogo infantil experto en inteligencia emocional y bibliotherapy.

Tu tarea es diseñar el ARCO NARRATIVO de un cuento infantil con intención pedagógica.

REGLAS:
- El arco debe tener un objetivo pedagógico claro
- El viaje emocional del protagonista debe ser transformador pero sutil
- El mensaje central debe ser apropiado para la edad
- Responde SOLO con JSON válido, sin markdown
`;

export interface NarrativeInput {
  heroName: string;
  itemLabel: string;
  itemDescription: string;
  ageGroup: AgeGroup;
  pedagogyProfile: PedagogyProfile;
  baseSystemPrompt: string;
}

export interface NarrativeArc {
  pedagogicalObjective: string;
  emotionalJourney: string;
  coreMessage: string;
  narrativeArcSummary: string;
  keyMoments: string[];
}

export async function generateArc(
  input: NarrativeInput,
  deps: AgentDependencies
): Promise<NarrativeArc> {
  // Formatear chunks RAG para el prompt
  const ragContext = formatChunksForPrompt(deps.ragChunks);
  
  const prompt = buildPrompt(input, ragContext);
  
  const response = await deps.geminiClient.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT + '\n\n' + input.baseSystemPrompt,
      temperature: 0.7,
    }
  });
  
  const responseText = response.text || '';
  return parseJsonSafely<NarrativeArc>(responseText);
}

function buildPrompt(input: NarrativeInput, ragContext: string): string {
  const pedagogySection = input.pedagogyProfile.enabled
    ? `
PERSONALIZACIÓN PEDAGÓGICA (El padre/tutor ha indicado):
- Retos de comportamiento: ${input.pedagogyProfile.behaviorChallenges.join(', ') || 'Ninguno'}
- Habilidades a reforzar: ${input.pedagogyProfile.skillsToReinforce.join(', ') || 'Ninguna'}
- Contexto emocional: ${input.pedagogyProfile.emotionalContext.join(', ') || 'Ninguno'}
- Motivaciones: ${input.pedagogyProfile.motivations.join(', ') || 'Ninguna'}
- Valores a transmitir: ${input.pedagogyProfile.valuesToTransmit.join(', ') || 'Ninguno'}
${input.pedagogyProfile.freeformContext ? `- Contexto adicional: ${input.pedagogyProfile.freeformContext}` : ''}
`
    : `
SIN PERSONALIZACIÓN PEDAGÓGICA:
Diseña un cuento de aventuras inspirador y entretenido.
`;

  return `
${ragContext ? `CONTEXTO CIENTÍFICO (Usa esto para fundamentar tus decisiones):\n${ragContext}\n\n---\n` : ''}

PERFIL DEL NIÑO:
- Nombre: ${input.heroName}
- Grupo de edad: ${input.ageGroup}
- Objeto mágico: ${input.itemLabel} (${input.itemDescription || 'sin descripción'})

${pedagogySection}

Diseña el ARCO NARRATIVO respondiendo SOLO con este JSON:
{
  "pedagogicalObjective": "El objetivo de aprendizaje/desarrollo del cuento",
  "emotionalJourney": "El viaje emocional del protagonista en una frase",
  "coreMessage": "El mensaje central que el niño se llevará",
  "narrativeArcSummary": "Resumen del arco en 3-4 frases",
  "keyMoments": ["momento_1", "punto_de_tension", "climax", "resolucion"]
}
  `.trim();
}
```

---

#### 8. `src/services/agents/visualBriefAgent.ts`

```typescript
/**
 * VISUAL BRIEF AGENT — Rol: Ilustrador Conceptual
 * 
 * Genera prompts de imagen para cada beat,
 * asegurando consistencia visual.
 */

import type { Beat, Genre } from '../../types';
import { AgentDependencies } from '../dependencies';
import { parseJsonSafely } from '../../utils/jsonParser';

const SYSTEM_PROMPT = `
Eres un ilustrador conceptual experto en libros infantiles.
Tu trabajo es generar briefs visuales detallados para cada página del cuento.

REGLAS:
- Mantén consistencia de personajes entre páginas
- Adapta el estilo visual al género indicado
- Incluye composición, iluminación y mood
- El objeto mágico debe ser visible y destacado
- Responde SOLO con JSON válido
`;

export interface VisualBriefInput {
  storyBeats: Beat[];
  genre: Genre;
  itemLabel: string;
  heroName: string;
  heroDescription?: string;
}

export interface VisualBrief {
  pageIndex: number;
  compositionNote: string;
  lightingMood: string;
  actionDescription: string;
  fullPrompt: string;
}

export async function generateBriefs(
  input: VisualBriefInput,
  deps: AgentDependencies
): Promise<VisualBrief[]> {
  const prompt = buildPrompt(input);
  
  const response = await deps.geminiClient.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.6, // Menos variabilidad para consistencia
    }
  });
  
  const responseText = response.text || '';
  return parseJsonSafely<VisualBrief[]>(responseText);
}

function buildPrompt(input: VisualBriefInput): string {
  const beatsText = input.storyBeats
    .map((beat, idx) => `Página ${idx + 1}: ${beat.scene}`)
    .join('\n');
  
  return `
ESTILO VISUAL: ${input.genre}
PROTAGONISTA: ${input.heroName}${input.heroDescription ? ` (${input.heroDescription})` : ''}
OBJETO MÁGICO: ${input.itemLabel}

ESCENAS A ILUSTRAR:
${beatsText}

Para cada página, genera un brief visual en este formato JSON:
[
  {
    "pageIndex": 0,
    "compositionNote": "Plano medio, protagonista centrado, fondo difuminado",
    "lightingMood": "Luz cálida de atardecer, sombras suaves",
    "actionDescription": "El niño mira sus zapatos que empiezan a brillar",
    "fullPrompt": "Prompt completo para el modelo de imagen incluyendo estilo ${input.genre}"
  }
]

IMPORTANTE:
- El fullPrompt debe incluir el estilo "${input.genre}"
- El objeto mágico (${input.itemLabel}) debe ser visible y destacado
- Mantén coherencia de iluminación y palette entre páginas
  `.trim();
}
```

---

#### 9. `src/services/agents/orchestratorAgent.ts`

```typescript
/**
 * ORCHESTRATOR AGENT
 * 
 * Coordina el pipeline completo ANTES de generar páginas.
 * Output: AgentBrief que guiará toda la generación posterior.
 */

import type { AgentBrief } from '../../types';
import { AgentDependencies, SessionContext } from '../dependencies';
import { queryRag } from '../ragService';
import * as narrativeAgent from './narrativeAgent';
import * as storytellingAgent from './storytellingAgent';
import * as visualBriefAgent from './visualBriefAgent';

export async function orchestrate(
  session: SessionContext,
  deps: AgentDependencies
): Promise<AgentBrief> {
  console.log('🎭 Orchestrator: Iniciando pipeline...');
  
  // ═══════════════════════════════════════════
  // PASO 1: Consultar RAG
  // ═══════════════════════════════════════════
  console.log('📚 Paso 1: Consultando RAG...');
  deps.ragChunks = await queryRag({
    ageGroup: session.ageGroup,
    pedagogy: session.pedagogyProfile,
    collections: session.tenantConfig.ragCollections,
    maxChunks: 5
  });
  console.log(`   → ${deps.ragChunks.length} chunks encontrados`);
  
  // ═══════════════════════════════════════════
  // PASO 2: Narrative Agent (Arco narrativo)
  // ═══════════════════════════════════════════
  console.log('🧠 Paso 2: Generando arco narrativo...');
  const narrativeArc = await narrativeAgent.generateArc({
    heroName: session.heroName,
    itemLabel: session.tenantConfig.itemLabel,
    itemDescription: session.itemDescription,
    ageGroup: session.ageGroup,
    pedagogyProfile: session.pedagogyProfile,
    baseSystemPrompt: session.tenantConfig.baseSystemPrompt
  }, deps);
  console.log(`   → Objetivo: ${narrativeArc.pedagogicalObjective}`);
  
  // ═══════════════════════════════════════════
  // PASO 3: Storytelling Agent (Beats)
  // ═══════════════════════════════════════════
  console.log('✍️ Paso 3: Generando beats...');
  const storyBeats = await storytellingAgent.generateBeats({
    narrativeArc: narrativeArc.narrativeArcSummary,
    ageGroup: session.ageGroup,
    language: session.language,
    genre: session.genre,
    heroName: session.heroName,
    itemLabel: session.tenantConfig.itemLabel,
    totalPages: 10
  }, deps);
  console.log(`   → ${storyBeats.length} beats generados`);
  
  // ═══════════════════════════════════════════
  // PASO 4: Visual Brief Agent (Prompts de imagen)
  // ═══════════════════════════════════════════
  console.log('🎨 Paso 4: Generando briefs visuales...');
  const visualBriefs = await visualBriefAgent.generateBriefs({
    storyBeats,
    genre: session.genre,
    itemLabel: session.tenantConfig.itemLabel,
    heroName: session.heroName,
    heroDescription: session.heroDescription || undefined
  }, deps);
  console.log(`   → ${visualBriefs.length} briefs visuales generados`);
  
  // ═══════════════════════════════════════════
  // COMPILAR AgentBrief
  // ═══════════════════════════════════════════
  const agentBrief: AgentBrief = {
    narrativeArc: narrativeArc.narrativeArcSummary,
    storyBeats,
    visualDirections: visualBriefs.map(vb => vb.fullPrompt)
  };
  
  console.log('✅ Orchestrator: Pipeline completado');
  return agentBrief;
}
```

---

## 🗄️ RAG V2: Migración a Supabase pgvector

### Cuándo migrar:
- Cuando tengamos >100 chunks
- Cuando el filtrado por tags sea insuficiente
- Cuando necesitemos búsqueda semántica real

### Cómo migrar:

```sql
-- En Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE rag_chunks (
  id TEXT PRIMARY KEY,
  collection TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  summary TEXT NOT NULL,
  full_content TEXT NOT NULL,
  source TEXT NOT NULL,
  embedding VECTOR(768),  -- gemini-embedding-001 con 768 dims
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON rag_chunks USING ivfflat (embedding vector_cosine_ops);
```

```typescript
// Generar embeddings con Gemini
const response = await ai.models.embedContent({
  model: 'gemini-embedding-001',
  contents: chunk.fullContent,
  config: { outputDimensionality: 768 }
});

const embedding = response.embeddings[0].values;
```

---

## ⚠️ Gotchas Críticos

1. **JSON de Gemini** — SIEMPRE usar `parseJsonSafely()`, nunca `JSON.parse()` directo
2. **Agentes secuenciales** — NO usar `Promise.all()`, el orden importa
3. **RAG V1 suficiente** — No implementar pgvector hasta tener +100 chunks
4. **Fotos no en backend** — Solo en memoria del navegador
5. **SDK actualizado** — Usar `GoogleGenAI` de `@google/genai`, no el antiguo

---

## ✅ Checklist de Implementación

```
FASE 3A - Cimientos:
□ jsonParser.ts creado y testeado
□ dependencies.ts creado
□ ragService.ts creado (filtrado por tags)
□ Chunks RAG placeholder creados (mínimo 10)

FASE 3B - Agentes:
□ storytellingAgent.ts funcional
□ narrativeAgent.ts con RAG
□ visualBriefAgent.ts
□ Cada agente parseando JSON correctamente

FASE 3C - Orquestación:
□ orchestratorAgent.ts coordinando todo
□ App.tsx llamando orchestrator
□ AgentBrief pasándose a generación de páginas
□ Flujo end-to-end funcional

FASE 3D - RAG Real (Cuando haya PDFs):
□ PDFs convertidos a markdown
□ Markdown chunkeado (~500 tokens/chunk)
□ Embeddings generados con gemini-embedding-001
□ Chunks subidos a Supabase pgvector
□ ragService.ts usando búsqueda semántica
```
