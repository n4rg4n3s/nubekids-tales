/**
 * storytellingAgent.ts
 * STORYTELLING AGENT — Rol: Escritor Creativo Infantil
 *
 * Convierte el brief experto en beats concretos,
 * preservando la intención pedagógica hasta el texto final.
 */

import type {
    Beat,
    AgeGroup,
    AgeGroupConfig,
    PedagogyProfile,
    Language,
    Genre,
    ItemInteractionMode,
} from '../../types';
import { AGE_GROUP_CONFIGS } from '../../types';
import type { AgentDependencies } from '../dependencies';
import { formatEditorialGuardrails } from '../../config/editorialGuardrails';
import { parseJsonSafely } from '../../utils/jsonParser';
import { getItemInteractionModeInstruction } from '../../utils/itemInteraction';
import type { ExpertNarrativeBrief } from './contracts';

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `
Eres un escritor creativo maestro del storytelling para niños.
Tu especialidad es convertir un brief experto en paginas legibles,
emocionalmente coherentes y calibradas para la edad del lector.

REGLAS ABSOLUTAS:
- Contenido 100% positivo, sin violencia, sin temas oscuros
- El objeto mágico SIEMPRE tiene un papel activo en la resolución
- Respeta ESTRICTAMENTE el límite de palabras por página
- Conserva la intención pedagógica del brief experto
- Las opciones interactivas viven SOLO en "choices", nunca en "caption" o "dialogue"
- Evita moralejas explícitas del tipo "aprendió que", "comprendió que" o equivalentes
- Responde SOLO con JSON válido, sin markdown, sin explicaciones
`.trim();

// ============================================
// TYPES
// ============================================

export interface StorytellingInput {
    expertBrief: ExpertNarrativeBrief;
    ageGroup: AgeGroup;
    pedagogyProfile: PedagogyProfile;
    language: Language;
    genre: Genre;
    heroName: string;
    friendName?: string;
    itemLabel: string;
    itemInteractionMode: ItemInteractionMode;
    itemDescription?: string;
    totalPages?: number;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Genera los beats (páginas) del cuento basándose en el arco narrativo.
 */
export async function generateBeats(
    input: StorytellingInput,
    deps: AgentDependencies
): Promise<Beat[]> {
    const ageGroupConfig = AGE_GROUP_CONFIGS[input.ageGroup];
    const totalPages = input.totalPages || 10;

    const prompt = buildPrompt(input, ageGroupConfig, totalPages);

    console.log('[StorytellingAgent] Generando beats...');
    console.log(`[StorytellingAgent] AgeGroup: ${input.ageGroup}, MaxWords: ${ageGroupConfig.maxWordsPerPage}`);

    const response = await deps.geminiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: `${SYSTEM_PROMPT}\n\nGUARDRAILS EDITORIALES:\n${formatEditorialGuardrails('storytelling', input.ageGroup)}`,
            responseMimeType: 'application/json',
            temperature: 0.8,
            maxOutputTokens: 8192,
        },
    });

    const responseText = response.text || '';
    const beats = parseJsonSafely<Beat[]>(responseText);

    // Validar y ajustar beats
    const validatedBeats = validateAndFixBeats(beats, ageGroupConfig, input.ageGroup);

    console.log(`[StorytellingAgent] ${validatedBeats.length} beats generados`);

    return validatedBeats;
}

// ============================================
// HELPERS
// ============================================

function buildPrompt(
    input: StorytellingInput,
    config: AgeGroupConfig,
    totalPages: number
): string {
    const friendSection = input.friendName
        ? `- Co-protagonista: ${input.friendName}`
        : '- Sin co-protagonista';
    const babyPromptNote = input.ageGroup === 'baby'
        ? '- Para baby, cada página funciona como un pie de imagen ritmico y visual. Todo el texto debe vivir preferentemente en "caption".'
        : '';
    const pedagogySection = buildPedagogyFocusSection(input.pedagogyProfile);
    const expertBriefSection = buildExpertBriefSection(input.expertBrief);

    return `
BRIEF EXPERTO A RESPETAR:
${expertBriefSection}

${pedagogySection}

CONFIGURACIÓN:
- Protagonista: ${input.heroName}
${friendSection}
- Objeto mágico: ${input.itemLabel}${input.itemDescription ? ` (${input.itemDescription})` : ''}
- Modo de interacción del objeto: ${input.itemInteractionMode}
- Guía de uso del objeto: ${getItemInteractionModeInstruction(input.itemInteractionMode)}
- Idioma: ${input.language}
- Estilo visual: ${input.genre}

REGLAS DE ESCRITURA (OBLIGATORIAS):
- Máximo ${config.maxWordsPerPage} palabras por página en "caption"
- Complejidad de frases: ${config.sentenceComplexity}
- Estructura narrativa: ${config.narrativeStructure}
- Profundidad emocional: ${config.emotionalDepth}
${babyPromptNote}

ORDEN DE PRIORIDAD:
1. Brief experto y contexto pedagógico real
2. Guardrails editoriales resumidos por edad
3. Creatividad de estilo

ESTRUCTURA DEL CUENTO:
- Página 1: Portada (solo título y escena visual)
- Páginas 2-3: Introducción del héroe y su mundo
- Páginas 4-5: Aparece el problema/desafío
- Página 6: Punto de decisión interactivo (incluir 2 opciones en "choices")
- Páginas 7-8: Desarrollo con el objeto mágico
- Página 9: Clímax y resolución
- Página 10: Final feliz y mensaje

Genera exactamente ${totalPages} beats en este formato JSON:
[
  {
    "scene": "Descripción visual detallada de la escena para el ilustrador",
    "caption": "Texto narrativo que aparece en la página (máx ${config.maxWordsPerPage} palabras)",
    "dialogue": "Diálogo del personaje si lo hay, o null",
    "choices": [],
    "focus_char": "hero"
  }
]

IMPORTANTE:
- El beat 1 es la PORTADA: caption debe ser solo el título creativo del cuento
- El beat 6 es el PUNTO DE DECISIÓN: incluir exactamente 2 opciones en "choices"
- En el beat 6, el "caption" solo describe el momento emocional de decisión. Las 2 opciones deben vivir exclusivamente dentro de "choices"
- Desde el beat 7 en adelante, desarrolla una sola línea narrativa canónica. Nunca escribas alternativas dentro del texto ni frases que empiecen por "O..." para narrar otra posibilidad
- No conviertas el final en una moraleja explicada. Muestra el cambio con acción, emoción, imagen y resultado, sin frases del tipo "aprendió que", "comprendió que", "ahora sabía que" o "la verdadera magia era"
- focus_char puede ser "hero", "friend", o "other"
- "scene" debe ser muy descriptiva para el ilustrador
- "caption" debe respetar el límite de palabras ESTRICTAMENTE
${input.ageGroup === 'baby' ? '- En baby, si necesitas una exclamacion o voz del narrador, integrala dentro de "caption". Evita "dialogue".' : ''}
  `.trim();
}

function buildExpertBriefSection(expertBrief: ExpertNarrativeBrief): string {
    return `
- Objetivo pedagógico: ${expertBrief.pedagogicalObjective}
- Objetivo emocional: ${expertBrief.emotionalObjective}
- Mensaje central: ${expertBrief.coreMessage}
- Resumen del arco: ${expertBrief.storyArcSummary}
- Razon por edad: ${expertBrief.ageRationale}
- Rol del objeto mágico: ${expertBrief.magicItemRole}
- Hitos clave: ${formatList(expertBrief.keyMoments)}
- Guías de lenguaje: ${formatList(expertBrief.languageGuidance)}
- Guías narrativas: ${formatList(expertBrief.narrativeGuidance)}
- Patrones a evitar: ${formatList(expertBrief.avoidPatterns)}
    `.trim();
}

function buildPedagogyFocusSection(pedagogy: PedagogyProfile): string {
    if (!pedagogy.enabled) {
        return 'MODO INSPIRACIONAL: sin personalizacion pedagogica explicita adicional.';
    }

    const notes: string[] = ['FOCO PEDAGOGICO REAL DE LA SESION:'];

    if (pedagogy.behaviorChallenges.length > 0 || pedagogy.customBehavior) {
        notes.push(`- Retos: ${[...pedagogy.behaviorChallenges, pedagogy.customBehavior].filter(Boolean).join(', ')}`);
    }
    if (pedagogy.skillsToReinforce.length > 0 || pedagogy.customSkill) {
        notes.push(`- Habilidades: ${[...pedagogy.skillsToReinforce, pedagogy.customSkill].filter(Boolean).join(', ')}`);
    }
    if (pedagogy.emotionalContext.length > 0 || pedagogy.customEmotion) {
        notes.push(`- Contexto emocional: ${[...pedagogy.emotionalContext, pedagogy.customEmotion].filter(Boolean).join(', ')}`);
    }
    if (pedagogy.motivations.length > 0 || pedagogy.customMotivation) {
        notes.push(`- Motivaciones: ${[...pedagogy.motivations, pedagogy.customMotivation].filter(Boolean).join(', ')}`);
    }
    if (pedagogy.valuesToTransmit.length > 0 || pedagogy.customValue) {
        notes.push(`- Valores: ${[...pedagogy.valuesToTransmit, pedagogy.customValue].filter(Boolean).join(', ')}`);
    }
    if (pedagogy.freeformContext) {
        notes.push(`- Contexto libre: ${pedagogy.freeformContext}`);
    }

    return notes.join('\n');
}

/**
 * Valida los beats y corrige problemas comunes.
 */
function countWords(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
}

function trimToWordLimit(text: string, limit: number): string {
    return text
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, limit)
        .join(' ');
}

function formatList(items: string[]): string {
    return items.length > 0 ? items.join(' | ') : 'sin indicaciones adicionales';
}

function validateAndFixBeats(beats: Beat[], config: AgeGroupConfig, ageGroup: AgeGroup): Beat[] {
    const decisionBeatIndex = 5;
    const endingBeatStartIndex = Math.max(beats.length - 2, 0);

    return beats.map((beat, idx) => {
        const cleanedCaption = sanitizeNarrativeText(beat.caption || '', {
            stripAlternativeScaffolding: idx >= decisionBeatIndex,
            softenMoralizingClosure: idx >= endingBeatStartIndex,
        });
        const cleanedDialogue = sanitizeNarrativeText(beat.dialogue || '', {
            stripAlternativeScaffolding: idx >= decisionBeatIndex,
            softenMoralizingClosure: idx >= endingBeatStartIndex,
        });
        const totalText = [cleanedCaption, cleanedDialogue].filter(Boolean).join(' ').trim();
        const normalizedCaption = ageGroup === 'baby'
            ? trimToWordLimit(totalText, config.maxWordsPerPage)
            : cleanedCaption;
        const wordCount = countWords(ageGroup === 'baby' ? normalizedCaption : totalText);

        if (wordCount > config.maxWordsPerPage) {
            console.warn(
                `[StorytellingAgent] Beat ${idx + 1} tiene ${wordCount} palabras (máx: ${config.maxWordsPerPage})`
            );
        }

        return {
            scene: beat.scene || '',
            caption: normalizedCaption,
            dialogue: ageGroup === 'baby' ? null : cleanedDialogue || null,
            choices: sanitizeChoices(beat.choices || [], idx, decisionBeatIndex),
            focus_char: beat.focus_char || 'hero',
            visualDirection: beat.visualDirection,
        } as Beat;
    });
}

interface SanitizeNarrativeTextOptions {
    stripAlternativeScaffolding: boolean;
    softenMoralizingClosure: boolean;
}

const LEADING_ALTERNATIVE_PATTERN = /^(?:o(?:\s+bien)?|o\s+tal\s+vez|o\s+quiz[aá])\s+/i;
const MORALIZING_SENTENCE_PATTERNS = [
    /\baprendi[oó]\s+que\b/i,
    /\bcomprendi[oó]\s+que\b/i,
    /\bdescubri[oó]\s+que\b/i,
    /\bahora\s+sab[ií]a\s+que\b/i,
    /\bla\s+verdadera\s+magia\s+era\b/i,
    /\blearned\s+that\b/i,
    /\brealized\s+that\b/i,
    /\bnow\s+(?:she|he|they)\s+knew\s+that\b/i,
    /\bthe\s+real\s+magic\s+was\b/i,
];

function sanitizeNarrativeText(text: string, options: SanitizeNarrativeTextOptions): string {
    let sanitized = normalizeWhitespace(text);

    if (!sanitized) {
        return '';
    }

    if (options.stripAlternativeScaffolding) {
        sanitized = stripAlternativeScaffolding(sanitized);
    }

    if (options.softenMoralizingClosure) {
        sanitized = softenMoralizingClosure(sanitized);
    }

    return normalizeWhitespace(sanitized);
}

function sanitizeChoices(choices: string[], idx: number, decisionBeatIndex: number): string[] {
    const normalizedChoices = choices
        .map((choice) => normalizeWhitespace(choice))
        .filter(Boolean);

    if (idx !== decisionBeatIndex) {
        return [];
    }

    return normalizedChoices.slice(0, 2);
}

function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

function stripAlternativeScaffolding(text: string): string {
    const sentences = splitSentences(text).map((sentence) => {
        const trimmed = sentence.trim();
        if (!trimmed) {
            return '';
        }

        const stripped = trimmed.replace(LEADING_ALTERNATIVE_PATTERN, '');

        return normalizeSentenceCapitalization(stripped);
    });

    return sentences.filter(Boolean).join(' ');
}

function softenMoralizingClosure(text: string): string {
    const sentences = splitSentences(text);
    const nonMoralizing = sentences.filter((sentence) => !isMoralizingSentence(sentence));

    if (nonMoralizing.length > 0) {
        return nonMoralizing.join(' ');
    }

    let softened = text;

    softened = softened
        .replace(/\b(?:aprendi[oó]|comprendi[oó]|descubri[oó])\s+que\s+/i, '')
        .replace(/\bahora\s+sab[ií]a\s+que\s+/i, '')
        .replace(/\bla\s+verdadera\s+magia\s+era\s+/i, '')
        .replace(/\blearned\s+that\s+/i, '')
        .replace(/\brealized\s+that\s+/i, '')
        .replace(/\bthe\s+real\s+magic\s+was\s+/i, '');

    return normalizeSentenceCapitalization(softened);
}

function isMoralizingSentence(sentence: string): boolean {
    return MORALIZING_SENTENCE_PATTERNS.some((pattern) => pattern.test(sentence));
}

function splitSentences(text: string): string[] {
    const matches = text.match(/[^.!?]+[.!?]?/g) || [];

    return matches
        .map((sentence) => normalizeWhitespace(sentence))
        .filter(Boolean);
}

function normalizeSentenceCapitalization(text: string): string {
    const trimmed = normalizeWhitespace(text);

    if (!trimmed) {
        return '';
    }

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
