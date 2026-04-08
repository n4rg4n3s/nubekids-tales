/**
 * storytellingAgent.ts
 * STORYTELLING AGENT — Rol: Escritor Creativo Infantil
 *
 * Convierte el arco narrativo en beats concretos,
 * calibrando vocabulario y estructura según AgeGroup.
 */

import type {
    Beat,
    AgeGroup,
    AgeGroupConfig,
    Language,
    Genre,
    ItemInteractionMode,
} from '../../types';
import { AGE_GROUP_CONFIGS } from '../../types';
import type { AgentDependencies } from '../dependencies';
import { parseJsonSafely } from '../../utils/jsonParser';
import { getItemInteractionModeInstruction } from '../../utils/itemInteraction';

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `
Eres un escritor creativo maestro del storytelling para niños.
Tu especialidad es adaptar vocabulario, ritmo y estructura narrativa 
exactamente al grupo de edad del lector.

REGLAS ABSOLUTAS:
- Contenido 100% positivo, sin violencia, sin temas oscuros
- El objeto mágico SIEMPRE tiene un papel activo en la resolución
- Respeta ESTRICTAMENTE el límite de palabras por página
- Responde SOLO con JSON válido, sin markdown, sin explicaciones
`.trim();

const AGE_SYSTEM_INSTRUCTIONS: Record<AgeGroup, string> = {
    baby: `
Estás escribiendo para un bebé o niño de 0 a 3 años. El adulto leerá el cuento en voz alta.

REGLAS ABSOLUTAS:
- Máximo 15 palabras por página en total.
- Frases de 3 a 5 palabras. Una frase por página suele ser suficiente.
- El texto debe sonar rítmico, musical y repetitivo.
- Usa vocabulario cotidiano, concreto y sensorial.
- No uses abstracciones ni emociones complejas.
- Celebra al protagonista con frecuencia.
- No introduzcas antagonistas ni conflictos.
- No incluyas diálogos separados del caption.
    `.trim(),
    tiny: `
Estás escribiendo para un niño de 3 a 4 años. El adulto sigue leyendo en voz alta.

REGLAS ABSOLUTAS:
- Máximo 30 palabras por página.
- Frases de 5 a 8 palabras.
- Repetición con variación y ritmo claro.
- Una sola emoción o idea por página.
- Reto pequeño, final gozoso y tranquilizador.
    `.trim(),
    little: `
Estás escribiendo para un niño de 4 a 5 años. El adulto todavía acompaña la lectura.

REGLAS ABSOLUTAS:
- Máximo 55 palabras por página.
- Frases de 7 a 12 palabras.
- El protagonista tiene un deseo claro, un obstáculo simple y una resolución satisfactoria.
- Usa conectores de causa-efecto y diálogos muy breves.
    `.trim(),
    reader: `
Estás escribiendo para un niño de 5 a 7 años que empieza a leer o ya lee con apoyo.

REGLAS ABSOLUTAS:
- Máximo 100 palabras por página.
- Frases de 10 a 18 palabras.
- Inicio, nudo y desenlace claramente diferenciados.
- El protagonista resuelve el desafío con sus propias capacidades.
- Usa vocabulario rico pero accesible y diálogos con personalidad.
    `.trim(),
};

// ============================================
// TYPES
// ============================================

export interface StorytellingInput {
    narrativeArc: string;
    ageGroup: AgeGroup;
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
            systemInstruction: `${SYSTEM_PROMPT}\n\n${AGE_SYSTEM_INSTRUCTIONS[input.ageGroup]}`,
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
        ? '- Para baby, cada página funciona como un pie de imagen rítmico y visual. Todo el texto va en "caption" sin "dialogue".'
        : '';

    return `
ARCO NARRATIVO A DESARROLLAR:
${input.narrativeArc}

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
- focus_char puede ser "hero", "friend", o "other"
- "scene" debe ser muy descriptiva para el ilustrador
- "caption" debe respetar el límite de palabras ESTRICTAMENTE
${input.ageGroup === 'baby' ? '- En baby, si necesitas una exclamación o voz del narrador, intégrala dentro de "caption". Nunca uses "dialogue".' : ''}
  `.trim();
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

function validateAndFixBeats(beats: Beat[], config: AgeGroupConfig, ageGroup: AgeGroup): Beat[] {
    return beats.map((beat, idx) => {
        const rawCaption = beat.caption || '';
        const rawDialogue = beat.dialogue || '';
        const totalText = [rawCaption, rawDialogue].filter(Boolean).join(' ').trim();
        const normalizedCaption = ageGroup === 'baby'
            ? trimToWordLimit(totalText, config.maxWordsPerPage)
            : rawCaption;
        const wordCount = countWords(ageGroup === 'baby' ? normalizedCaption : totalText);

        if (wordCount > config.maxWordsPerPage) {
            console.warn(
                `[StorytellingAgent] Beat ${idx + 1} tiene ${wordCount} palabras (máx: ${config.maxWordsPerPage})`
            );
        }

        return {
            scene: beat.scene || '',
            caption: normalizedCaption,
            dialogue: ageGroup === 'baby' ? null : beat.dialogue || null,
            choices: beat.choices || [],
            focus_char: beat.focus_char || 'hero',
            visualDirection: beat.visualDirection,
        } as Beat;
    });
}
