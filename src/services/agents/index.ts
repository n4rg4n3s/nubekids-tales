/**
 * index.ts
 * Re-exporta todos los agentes para fácil importación.
 *
 * Uso:
 * import { orchestrate, generateBeats, generateArc } from './services/agents';
 */

// Orchestrator - Punto de entrada principal
export {
    orchestrate,
    validateSessionContext,
    type OrchestratorResult,
} from './orchestratorAgent';

// Narrative Agent - Arco narrativo
export {
    generateArc,
    type NarrativeInput,
} from './narrativeAgent';
export type { ExpertNarrativeBrief } from './contracts';

// Storytelling Agent - Beats/páginas
export {
    generateBeats,
    type StorytellingInput,
} from './storytellingAgent';

// Visual Brief Agent - Prompts de imagen
export {
    generateBriefs,
    extractImagePrompts,
    type VisualBriefInput,
    type VisualBrief,
} from './visualBriefAgent';
