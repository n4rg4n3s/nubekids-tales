/**
 * narrativeAgent.ts
 * NARRATIVE AGENT — Rol: Neuroeducador + Psicólogo Infantil
 *
 * Destila el contexto experto en un brief narrativo operativo
 * usando RAG científico y la verdad contextual del usuario.
 */

import type { AgeGroup, ItemInteractionMode, PedagogyProfile } from '../../types';
import type { AgentDependencies } from '../dependencies';
import { formatEditorialGuardrails } from '../../config/editorialGuardrails';
import { formatChunksForPrompt } from '../ragService';
import { parseJsonSafely } from '../../utils/jsonParser';
import { getItemInteractionModeInstruction } from '../../utils/itemInteraction';
import type { ExpertNarrativeBrief } from './contracts';

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `
Eres un equipo de dos expertos colaborando:
1. Un neuroeducador especialista en desarrollo cognitivo infantil (Piaget, Vygotsky, Gardner).
2. Un psicólogo infantil experto en inteligencia emocional y bibliotherapy.

Tu tarea es destilar un BRIEF NARRATIVO EXPERTO para un cuento infantil con intención pedagógica.

REGLAS:
- Prioriza la verdad del usuario y el contexto experto recuperado
- Usa los guardrails editoriales solo como marco resumido, no como fuente científica principal
- El brief debe conservar matices utiles para los agentes posteriores
- El objeto mágico es CENTRAL en la resolución, no un accesorio
- Evita moralejas explicadas y formulas del tipo "aprendio que", "comprendio que" o equivalentes
- Si hay aprendizaje, expresalo como cambio observable, accion o clima emocional, no como leccion verbalizada
- Responde SOLO con JSON válido, sin markdown, sin explicaciones
`.trim();

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

interface NarrativeResponse extends Omit<Partial<ExpertNarrativeBrief>, 'keyMoments'> {
    pedagogicalObjective: string;
    emotionalObjective?: string;
    emotionalJourney?: string;
    coreMessage: string;
    storyArcSummary?: string;
    narrativeArcSummary?: string;
    keyMoments: unknown;
    magicItemRole: string;
    ageRationale?: string;
    languageGuidance?: string[];
    narrativeGuidance?: string[];
    avoidPatterns?: string[];
    visualGuidance?: string[];
}

/**
 * Genera un brief experto basándose en el perfil del niño y el contexto RAG.
 */
export async function generateArc(
    input: NarrativeInput,
    deps: AgentDependencies
): Promise<ExpertNarrativeBrief> {
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
    const rawBrief = parseJsonSafely<NarrativeResponse>(responseText);
    const brief = normalizeExpertNarrativeBrief(rawBrief);

    console.log(`[NarrativeAgent] Objetivo: ${brief.pedagogicalObjective}`);

    return brief;
}

// ============================================
// HELPERS
// ============================================

function buildPrompt(input: NarrativeInput, ragContext: string): string {
    const pedagogySection = buildPedagogySection(input.pedagogyProfile);
    const ageGuardrails = formatEditorialGuardrails('narrative', input.ageGroup);
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

GUARDRAILS EDITORIALES PARA ${input.ageGroup.toUpperCase()}:
${ageGuardrails}

Devuelve un BRIEF NARRATIVO EXPERTO respondiendo SOLO con este JSON:
{
  "pedagogicalObjective": "El objetivo de aprendizaje/desarrollo del cuento (una frase clara)",
  "emotionalObjective": "La emocion o transformacion emocional que debe quedar viva en el cuento",
  "coreMessage": "La verdad emocional o relacional que sostendra el cuento, sin escribir una moraleja explicita",
  "storyArcSummary": "Resumen del arco narrativo en 3-4 frases centrado en acciones y cambios observables, no en lecciones explicadas",
  "keyMoments": {
    "momento_inicio": "cómo empieza el cuento",
    "problema": "qué reto pequeño aparece",
    "descubrimiento_magia": "cómo aparece la magia",
    "punto_decision": "qué decide el protagonista",
    "climax": "momento culminante",
    "resolucion": "cómo se resuelve en escena y emocion visible, sin frases del tipo 'ha aprendido que'"
  },
  "magicItemRole": "Cómo el objeto mágico ayuda específicamente en la resolución",
  "ageRationale": "Por qué este enfoque es adecuado para la edad y el contexto del niño",
  "languageGuidance": ["regla operativa de lenguaje 1", "regla operativa de lenguaje 2"],
  "narrativeGuidance": ["regla operativa de estructura 1", "regla operativa de estructura 2"],
  "avoidPatterns": ["patron a evitar 1", "patron a evitar 2"],
  "visualGuidance": ["guia visual 1", "guia visual 2"]
}

IMPORTANTE:
- Si el usuario ha dado contexto pedagogico, ese contexto debe gobernar el brief
- Si el RAG aporta matices utiles, priorizalos sobre cualquier simplificacion general
- "keyMoments" debe ser un OBJETO JSON con esas 6 claves exactas, no un array
- "languageGuidance", "narrativeGuidance", "avoidPatterns" y "visualGuidance" deben ser concretos y accionables
- El "magicItemRole" debe explicar POR QUE el objeto mágico es esencial, no accesorio
- No escribas conclusiones doctrinales ni frases del tipo "aprendio que", "comprendio que", "ahora sabia que" o "la verdadera magia era"
- Si debes expresar transformacion, hazlo como conducta visible, clima emocional o consecuencia dramatizada
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

function normalizeExpertNarrativeBrief(raw: NarrativeResponse): ExpertNarrativeBrief {
    return {
        pedagogicalObjective: raw.pedagogicalObjective || '',
        emotionalObjective: raw.emotionalObjective || raw.emotionalJourney || '',
        coreMessage: sanitizeCoreMessage(raw.coreMessage || ''),
        storyArcSummary: sanitizeNarrativeSummary(raw.storyArcSummary || raw.narrativeArcSummary || ''),
        keyMoments: normalizeKeyMoments(raw.keyMoments).map(sanitizeKeyMomentEntry),
        magicItemRole: raw.magicItemRole || '',
        ageRationale: raw.ageRationale || '',
        languageGuidance: normalizeStringArray(raw.languageGuidance),
        narrativeGuidance: normalizeStringArray(raw.narrativeGuidance),
        avoidPatterns: normalizeStringArray(raw.avoidPatterns),
        visualGuidance: normalizeStringArray(raw.visualGuidance),
    };
}

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeKeyMoments(value: unknown): string[] {
    if (Array.isArray(value)) {
        return normalizeStringArray(value);
    }

    if (!value || typeof value !== 'object') {
        return [];
    }

    return Object.entries(value)
        .filter((entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string')
        .map(([key, description]) => `${key}: ${description.trim()}`)
        .filter(Boolean);
}

const DIDACTIC_LEAD_IN_PATTERNS = [
    /\bha\s+aprendido\s+que\s+/i,
    /\bhan\s+aprendido\s+que\s+/i,
    /\baprendi[oó]\s+que\s+/i,
    /\bcomprendi[oó]\s+que\s+/i,
    /\bdescubri[oó]\s+que\s+/i,
    /\bahora\s+sab[ií]a\s+que\s+/i,
    /\bahora\s+sabe\s+que\s+/i,
    /\bla\s+verdadera\s+magia\s+era\s+/i,
    /\blearned\s+that\s+/i,
    /\brealized\s+that\s+/i,
    /\bnow\s+(?:she|he|they)\s+knew\s+that\s+/i,
    /\bthe\s+real\s+magic\s+was\s+/i,
];

const DIDACTIC_SENTENCE_PATTERNS = [
    /\bha\s+aprendido\s+que\b/i,
    /\bhan\s+aprendido\s+que\b/i,
    /\baprendi[oó]\s+que\b/i,
    /\bcomprendi[oó]\s+que\b/i,
    /\bdescubri[oó]\s+que\b/i,
    /\bahora\s+sab[ií]a\s+que\b/i,
    /\bahora\s+sabe\s+que\b/i,
    /\bla\s+verdadera\s+magia\s+era\b/i,
    /\blearned\s+that\b/i,
    /\brealized\s+that\b/i,
    /\bnow\s+(?:she|he|they)\s+knew\s+that\b/i,
    /\bthe\s+real\s+magic\s+was\b/i,
];

function sanitizeCoreMessage(text: string): string {
    const stripped = stripDidacticLeadIns(normalizeWhitespace(text));
    return normalizeSentenceCapitalization(stripped);
}

function sanitizeNarrativeSummary(text: string): string {
    return sanitizeNarrativeSurface(text);
}

function sanitizeKeyMomentEntry(entry: string): string {
    const separatorIndex = entry.indexOf(':');

    if (separatorIndex === -1) {
        return sanitizeNarrativeSurface(entry);
    }

    const key = entry.slice(0, separatorIndex).trim();
    const description = entry.slice(separatorIndex + 1).trim();
    const sanitizedDescription = sanitizeNarrativeSurface(description);

    return `${key}: ${sanitizedDescription}`;
}

function sanitizeNarrativeSurface(text: string): string {
    const normalized = normalizeWhitespace(text);

    if (!normalized) {
        return '';
    }

    const sentences = splitSentences(normalized);
    const filteredSentences = sentences.filter((sentence) => !isDidacticSentence(sentence));

    if (filteredSentences.length > 0) {
        return filteredSentences
            .map((sentence) => normalizeSentenceCapitalization(stripDidacticLeadIns(sentence)))
            .filter(Boolean)
            .join(' ');
    }

    return normalizeSentenceCapitalization(stripDidacticLeadIns(normalized));
}

function stripDidacticLeadIns(text: string): string {
    let sanitized = text;

    for (const pattern of DIDACTIC_LEAD_IN_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    return normalizeWhitespace(sanitized);
}

function isDidacticSentence(sentence: string): boolean {
    return DIDACTIC_SENTENCE_PATTERNS.some((pattern) => pattern.test(sentence));
}

function splitSentences(text: string): string[] {
    const matches = text.match(/[^.!?]+[.!?]?/g) || [];

    return matches
        .map((sentence) => normalizeWhitespace(sentence))
        .filter(Boolean);
}

function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

function normalizeSentenceCapitalization(text: string): string {
    const trimmed = normalizeWhitespace(text);

    if (!trimmed) {
        return '';
    }

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
