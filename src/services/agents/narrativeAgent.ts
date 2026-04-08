/**
 * narrativeAgent.ts
 * NARRATIVE AGENT — Rol: Neuroeducador + Psicólogo Infantil
 *
 * Diseña el arco narrativo con intención pedagógica,
 * usando contexto del RAG científico.
 */

import type { AgeGroup, ItemInteractionMode, PedagogyProfile } from '../../types';
import type { AgentDependencies } from '../dependencies';
import { formatChunksForPrompt } from '../ragService';
import { parseJsonSafely } from '../../utils/jsonParser';
import { getItemInteractionModeInstruction } from '../../utils/itemInteraction';

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `
Eres un equipo de dos expertos colaborando:
1. Un neuroeducador especialista en desarrollo cognitivo infantil (Piaget, Vygotsky, Gardner).
2. Un psicólogo infantil experto en inteligencia emocional y bibliotherapy.

Tu tarea es diseñar el ARCO NARRATIVO de un cuento infantil con intención pedagógica.

REGLAS:
- El arco debe tener un objetivo pedagógico claro (incluso si es solo "inspirar y entretener")
- El viaje emocional del protagonista debe ser transformador pero sutil
- El mensaje central debe ser apropiado para la edad
- El objeto mágico es CENTRAL en la resolución, no un accesorio
- Responde SOLO con JSON válido, sin markdown, sin explicaciones
`.trim();

const NARRATIVE_AGE_INSTRUCTIONS: Record<AgeGroup, string> = {
    baby: `
El arco narrativo para 0-3 años NO es una historia convencional.
Es una secuencia de momentos gozosos y sensoriales protagonizados por el niño.
Estructura sugerida:
- Página 1: presentación celebratoria
- Páginas 2-8: exploración cotidiana o sensorial con el objeto mágico
- Página 9: momento cumbre de alegría o descubrimiento
- Página 10: cierre calmado y tranquilizador
No hay antagonista ni conflicto. Solo observación, nombrar y celebrar.
    `.trim(),
    tiny: `
Arco narrativo simple de 3 actos en 10 páginas:
- Páginas 1-2: presentación del protagonista y su mundo
- Páginas 3-4: aparece el objeto mágico o un deseo pequeño
- Páginas 5-7: búsqueda o reto concreto
- Páginas 8-9: resolución con pequeño esfuerzo propio
- Página 10: final celebratorio y tranquilizador
    `.trim(),
    little: `
Arco narrativo con causa-efecto claro:
- Páginas 1-2: protagonista, mundo y deseo claro
- Páginas 3-5: el objeto mágico complica o facilita el deseo
- Páginas 6-8: obstáculo simple, intento, ajuste y nuevo intento
- Página 9: superación del obstáculo con recursos propios
- Página 10: resolución del deseo y aprendizaje emocional implícito
    `.trim(),
    reader: `
Arco narrativo completo con tensión sostenida:
- Páginas 1-2: mundo, protagonista y problema insinuado
- Páginas 3-4: el objeto mágico entra en escena y el protagonista decide actuar
- Páginas 5-7: nudo con complicaciones e intentos fallidos
- Página 8: momento de máxima duda o tensión
- Página 9: resolución por iniciativa del protagonista
- Página 10: desenlace con consecuencia emocional real
    `.trim(),
};

// ============================================
// TYPES
// ============================================

export interface NarrativeInput {
    heroName: string;
    friendName?: string;
    itemLabel: string;
    itemInteractionMode: ItemInteractionMode;
    itemDescription: string;
    ageGroup: AgeGroup;
    pedagogyProfile: PedagogyProfile;
    baseSystemPrompt: string;
    storeName?: string;
}

export interface NarrativeArc {
    pedagogicalObjective: string;
    emotionalJourney: string;
    coreMessage: string;
    narrativeArcSummary: string;
    keyMoments: string[];
    magicItemRole: string;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Genera el arco narrativo basándose en el perfil del niño y el contexto RAG.
 */
export async function generateArc(
    input: NarrativeInput,
    deps: AgentDependencies
): Promise<NarrativeArc> {
    // Formatear chunks RAG para el prompt
    const ragContext = formatChunksForPrompt(deps.ragChunks);

    const prompt = buildPrompt(input, ragContext);

    console.log('[NarrativeAgent] Generando arco narrativo...');
    console.log(`[NarrativeAgent] Pedagogía activa: ${input.pedagogyProfile.enabled}`);
    if (deps.ragChunks.length > 0) {
        console.log(`[NarrativeAgent] Usando ${deps.ragChunks.length} chunks RAG`);
    }

    const fullSystemPrompt = SYSTEM_PROMPT + '\n\n' + input.baseSystemPrompt;

    const response = await deps.geminiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: fullSystemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 8192,
        },
    });

    const responseText = response.text || '';
    const arc = parseJsonSafely<NarrativeArc>(responseText);

    console.log(`[NarrativeAgent] Objetivo: ${arc.pedagogicalObjective}`);

    return arc;
}

// ============================================
// HELPERS
// ============================================

function buildPrompt(input: NarrativeInput, ragContext: string): string {
    const pedagogySection = buildPedagogySection(input.pedagogyProfile);
    const friendSection = input.friendName
        ? `- Co-protagonista: ${input.friendName}`
        : '';
    const storeSection = input.storeName
        ? `- Tienda de origen: ${input.storeName} (mencionar sutilmente en la historia)`
        : '';
    const interactionSection = `- Modo de interacción del objeto: ${input.itemInteractionMode}
- Guía de uso del objeto: ${getItemInteractionModeInstruction(input.itemInteractionMode)}`;

    return `
${ragContext ? `${ragContext}\n\n` : ''}
PERFIL DEL PROTAGONISTA:
- Nombre: ${input.heroName}
- Grupo de edad: ${input.ageGroup}
${friendSection}
- Objeto mágico: ${input.itemLabel}${input.itemDescription ? ` - ${input.itemDescription}` : ''}
${interactionSection}
${storeSection}

${pedagogySection}

INSTRUCCIONES NARRATIVAS PARA ${input.ageGroup.toUpperCase()}:
${NARRATIVE_AGE_INSTRUCTIONS[input.ageGroup]}

Diseña el ARCO NARRATIVO respondiendo SOLO con este JSON:
{
  "pedagogicalObjective": "El objetivo de aprendizaje/desarrollo del cuento (una frase clara)",
  "emotionalJourney": "El viaje emocional del protagonista en una frase",
  "coreMessage": "El mensaje central que el niño se llevará",
  "narrativeArcSummary": "Resumen del arco narrativo en 3-4 frases",
  "keyMoments": ["momento_inicio", "problema", "descubrimiento_magia", "punto_decision", "climax", "resolucion"],
  "magicItemRole": "Cómo el objeto mágico ayuda específicamente en la resolución"
}

IMPORTANTE:
- El "pedagogicalObjective" debe ser concreto y alcanzable en un cuento corto
- El "magicItemRole" debe explicar POR QUÉ el objeto mágico es esencial, no accesorio
- Los "keyMoments" deben ser específicos para esta historia, no genéricos
  `.trim();
}

function buildPedagogySection(pedagogy: PedagogyProfile): string {
    if (!pedagogy.enabled) {
        return `
MODO INSPIRACIONAL (Sin personalización pedagógica específica):
Diseña un cuento de aventuras inspirador y entretenido.
El objetivo pedagógico será general: fomentar la imaginación, la valentía y la curiosidad.
    `.trim();
    }

    const sections: string[] = ['PERSONALIZACIÓN PEDAGÓGICA (El padre/tutor ha indicado):'];

    if (pedagogy.behaviorChallenges.length > 0 || pedagogy.customBehavior) {
        const challenges = [...pedagogy.behaviorChallenges];
        if (pedagogy.customBehavior) challenges.push(pedagogy.customBehavior);
        sections.push(`- Retos a trabajar: ${challenges.join(', ')}`);
    }

    if (pedagogy.skillsToReinforce.length > 0 || pedagogy.customSkill) {
        const skills = [...pedagogy.skillsToReinforce];
        if (pedagogy.customSkill) skills.push(pedagogy.customSkill);
        sections.push(`- Habilidades a reforzar: ${skills.join(', ')}`);
    }

    if (pedagogy.emotionalContext.length > 0 || pedagogy.customEmotion) {
        const emotions = [...pedagogy.emotionalContext];
        if (pedagogy.customEmotion) emotions.push(pedagogy.customEmotion);
        sections.push(`- Contexto emocional: ${emotions.join(', ')}`);
    }

    if (pedagogy.motivations.length > 0 || pedagogy.customMotivation) {
        const motivations = [...pedagogy.motivations];
        if (pedagogy.customMotivation) motivations.push(pedagogy.customMotivation);
        sections.push(`- Intereses/motivaciones: ${motivations.join(', ')}`);
    }

    if (pedagogy.valuesToTransmit.length > 0 || pedagogy.customValue) {
        const values = [...pedagogy.valuesToTransmit];
        if (pedagogy.customValue) values.push(pedagogy.customValue);
        sections.push(`- Valores a transmitir: ${values.join(', ')}`);
    }

    if (pedagogy.freeformContext) {
        sections.push(`- Contexto adicional: ${pedagogy.freeformContext}`);
    }

    sections.push('');
    sections.push('IMPORTANTE: El cuento debe abordar estos aspectos de forma SUTIL y POSITIVA.');
    sections.push('Nunca moralizar directamente. El aprendizaje surge de la experiencia del protagonista.');

    return sections.join('\n');
}
