/**
 * visualBriefAgent.ts
 * VISUAL BRIEF AGENT — Rol: Ilustrador Conceptual
 *
 * Genera prompts de imagen para cada beat,
 * asegurando consistencia visual a lo largo del cuento.
 */

import type { Beat, Genre, ItemInteractionMode } from '../../types';
import type { AgentDependencies } from '../dependencies';
import { parseJsonSafely } from '../../utils/jsonParser';
import {
    getItemInteractionModeInstruction,
    getItemInteractionPromptExample,
    getItemInteractionVisualGuidance,
} from '../../utils/itemInteraction';

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `
Eres un ilustrador conceptual experto en libros infantiles.
Tu trabajo es generar briefs visuales detallados para cada página del cuento.

REGLAS:
- Mantén CONSISTENCIA de personajes entre todas las páginas
- El protagonista debe verse IGUAL en todas las ilustraciones
- Adapta el estilo visual al género indicado
- Incluye composición, iluminación y mood específicos
- El objeto mágico debe ser VISIBLE y DESTACADO en cada escena relevante
- Responde SOLO con JSON válido, sin markdown, sin explicaciones

ESTILOS VISUALES:
- "3D Animation Magic": Estilo Pixar/Disney, colores vibrantes, iluminación cinematográfica
- "Classic Fairytale": Acuarelas suaves, bordes difusos, paleta pastel
- "Anime Adventure": Ojos expresivos, colores saturados, líneas dinámicas
- "Whimsical Claymation": Texturas de plastilina, colores primarios, formas redondeadas
- "Custom": Adaptar según indicaciones
`.trim();

// ============================================
// TYPES
// ============================================

export interface VisualBriefInput {
    storyBeats: Beat[];
    genre: Genre;
    itemLabel: string;
    itemInteractionMode: ItemInteractionMode;
    itemDescription?: string;
    heroName: string;
    heroDescription?: string;
    friendName?: string;
    friendDescription?: string;
}

export interface VisualBrief {
    pageIndex: number;
    compositionNote: string;
    lightingMood: string;
    characterDirection: string;
    magicItemVisibility: string;
    fullPrompt: string;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Genera briefs visuales para cada beat del cuento.
 */
export async function generateBriefs(
    input: VisualBriefInput,
    deps: AgentDependencies
): Promise<VisualBrief[]> {
    const prompt = buildPrompt(input);

    console.log('[VisualBriefAgent] Generando briefs visuales...');
    console.log(`[VisualBriefAgent] Género: ${input.genre}, Páginas: ${input.storyBeats.length}`);

    const response = await deps.geminiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.6, // Menos variabilidad para consistencia visual
            maxOutputTokens: 8192,
        },
    });

    const responseText = response.text || '';
    const briefs = parseJsonSafely<VisualBrief[]>(responseText);

    // Validar que tenemos un brief por página
    if (briefs.length !== input.storyBeats.length) {
        console.warn(
            `[VisualBriefAgent] Generados ${briefs.length} briefs para ${input.storyBeats.length} páginas`
        );
    }

    console.log(`[VisualBriefAgent] ${briefs.length} briefs visuales generados`);

    return briefs;
}

// ============================================
// HELPERS
// ============================================

function buildPrompt(input: VisualBriefInput): string {
    const beatsText = input.storyBeats
        .map((beat, idx) => {
            const focusChar = beat.focus_char || 'hero';
            return `Página ${idx + 1} [Foco: ${focusChar}]: ${beat.scene}`;
        })
        .join('\n');

    const heroSection = input.heroDescription
        ? `- Protagonista: ${input.heroName} (${input.heroDescription})`
        : `- Protagonista: ${input.heroName}`;

    const friendSection = input.friendName
        ? input.friendDescription
            ? `- Co-protagonista: ${input.friendName} (${input.friendDescription})`
            : `- Co-protagonista: ${input.friendName}`
        : '';

    const itemSection = input.itemDescription
        ? `- Objeto mágico: ${input.itemLabel} (${input.itemDescription})`
        : `- Objeto mágico: ${input.itemLabel}`;
    const interactionSection = [
        `- Modo de interacción del objeto: ${input.itemInteractionMode}`,
        `- Guía narrativa: ${getItemInteractionModeInstruction(input.itemInteractionMode)}`,
        `- Guía visual: ${getItemInteractionVisualGuidance(input.itemInteractionMode, input.itemLabel)}`,
    ].join('\n');
    const examplePrompt = getItemInteractionPromptExample(
        input.itemInteractionMode,
        input.heroName,
        input.itemLabel
    );

    return `
ESTILO VISUAL: ${input.genre}

PERSONAJES:
${heroSection}
${friendSection}
${itemSection}
${interactionSection}

ESCENAS A ILUSTRAR:
${beatsText}

Para CADA página, genera un brief visual en este formato JSON:
[
  {
    "pageIndex": 0,
    "compositionNote": "Tipo de plano y composición (ej: plano medio, protagonista a la izquierda, fondo de bosque)",
    "lightingMood": "Iluminación y atmósfera (ej: luz dorada de atardecer, sombras suaves, ambiente cálido)",
    "characterDirection": "Pose y expresión del personaje principal (ej: mirando hacia arriba con asombro, brazos abiertos)",
    "magicItemVisibility": "Cómo aparece el objeto mágico (ej: en primer plano brillando, en los pies del protagonista con destellos)",
    "fullPrompt": "Prompt completo para el modelo de imagen, incluyendo estilo ${input.genre}, todos los detalles de composición, personaje y objeto mágico"
  }
]

REGLAS PARA fullPrompt:
1. Empezar SIEMPRE con el estilo: "${input.genre} style illustration"
2. Describir al protagonista de forma CONSISTENTE en todas las páginas
3. El objeto mágico (${input.itemLabel}) debe mencionarse cuando sea relevante
4. Respetar SIEMPRE el modo de interacción del objeto: ${input.itemInteractionMode}
5. ${getItemInteractionVisualGuidance(input.itemInteractionMode, input.itemLabel)}
6. NO asumir que el objeto se lleva puesto salvo que el modo sea "wearable"
7. Incluir la acción específica de la escena
8. Terminar con detalles de iluminación y mood
9. NO incluir texto ni letras en las ilustraciones
10. Máximo 100 palabras por fullPrompt

EJEMPLO de fullPrompt:
"${input.genre} style illustration. ${examplePrompt} Wide-eyed expression of wonder, scene-specific action, warm golden sunlight filtering through the environment, magical particles floating in the air. Soft shadows, whimsical atmosphere."
  `.trim();
}

/**
 * Extrae solo los fullPrompts de los briefs para uso en generación de imágenes.
 */
export function extractImagePrompts(briefs: VisualBrief[]): string[] {
    return briefs.map((brief) => brief.fullPrompt);
}
