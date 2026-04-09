import type { AgeGroup } from '../types';

export type ExpertCollection = 'child-psych' | 'storytelling';
export type GuardrailAgent = 'narrative' | 'storytelling' | 'visual';

export interface EditorialGuardrail {
    id: string;
    ageGroup: AgeGroup;
    agent: GuardrailAgent;
    text: string;
    sourceDocs: string[];
    sourceCollections: ExpertCollection[];
}

const SOURCE_DOCS = ['docs/segmentacion_edades.md', 'docs/words_x_age.md'];
const SOURCE_COLLECTIONS: ExpertCollection[] = ['child-psych', 'storytelling'];

function createGuardrail(
    id: string,
    ageGroup: AgeGroup,
    agent: GuardrailAgent,
    text: string
): EditorialGuardrail {
    return {
        id,
        ageGroup,
        agent,
        text,
        sourceDocs: SOURCE_DOCS,
        sourceCollections: SOURCE_COLLECTIONS,
    };
}

const AGE_EDITORIAL_GUARDRAILS: Record<
    AgeGroup,
    Record<GuardrailAgent, EditorialGuardrail[]>
> = {
    baby: {
        narrative: [
            createGuardrail(
                'baby-narrative-sensory',
                'baby',
                'narrative',
                'Prioriza momentos sensoriales, cotidianos y celebratorios; evita conflicto convencional.'
            ),
            createGuardrail(
                'baby-narrative-coregulation',
                'baby',
                'narrative',
                'La experiencia del adulto lector debe transmitir calma, previsibilidad y co-regulacion.'
            ),
        ],
        storytelling: [
            createGuardrail(
                'baby-storytelling-minimal-text',
                'baby',
                'storytelling',
                'Escribe con texto minimo, musical y concreto; una sola idea clara por pagina.'
            ),
            createGuardrail(
                'baby-storytelling-no-dialogue',
                'baby',
                'storytelling',
                'Integra toda la voz en caption y evita dialogue separado salvo necesidad tecnica extrema.'
            ),
            createGuardrail(
                'baby-storytelling-celebration',
                'baby',
                'storytelling',
                'Nombra lo visible y celebra al protagonista con lenguaje calido y sencillo.'
            ),
        ],
        visual: [
            createGuardrail(
                'baby-visual-dominant-image',
                'baby',
                'visual',
                'La imagen debe sostener casi todo el peso narrativo con foco central muy claro.'
            ),
            createGuardrail(
                'baby-visual-simplicity',
                'baby',
                'visual',
                'Usa composiciones limpias, formas redondeadas y expresiones emocionales facilmente legibles.'
            ),
        ],
    },
    tiny: {
        narrative: [
            createGuardrail(
                'tiny-narrative-small-challenge',
                'tiny',
                'narrative',
                'Plantea un reto pequeno y tranquilizador que el nino pueda anticipar y seguir.'
            ),
            createGuardrail(
                'tiny-narrative-repetition',
                'tiny',
                'narrative',
                'La repeticion con variacion debe reforzar seguridad y participacion.'
            ),
        ],
        storytelling: [
            createGuardrail(
                'tiny-storytelling-short-rhythm',
                'tiny',
                'storytelling',
                'Usa frases cortas, ritmicas y muy claras; no mezcles mas de una emocion por pagina.'
            ),
            createGuardrail(
                'tiny-storytelling-simple-dialogue',
                'tiny',
                'storytelling',
                'Si hay dialogo, debe ser minimo y facilmente dramatizable por un adulto lector.'
            ),
            createGuardrail(
                'tiny-storytelling-safe-resolution',
                'tiny',
                'storytelling',
                'El final debe ser gozoso, previsible y emocionalmente seguro.'
            ),
        ],
        visual: [
            createGuardrail(
                'tiny-visual-legibility',
                'tiny',
                'visual',
                'La escena debe ser inmediata de leer: protagonista y objeto siempre reconocibles.'
            ),
            createGuardrail(
                'tiny-visual-context',
                'tiny',
                'visual',
                'El fondo puede aportar contexto, pero nunca competir con la accion principal.'
            ),
        ],
    },
    little: {
        narrative: [
            createGuardrail(
                'little-narrative-cause-effect',
                'little',
                'narrative',
                'El arco debe apoyarse en causa-efecto claro, deseo identificable y obstaculo simple.'
            ),
            createGuardrail(
                'little-narrative-emotional-clarity',
                'little',
                'narrative',
                'La transformacion emocional debe ser legible sin moralizar.'
            ),
        ],
        storytelling: [
            createGuardrail(
                'little-storytelling-structured-arc',
                'little',
                'storytelling',
                'Construye paginas con progreso narrativo claro, no solo descripcion acumulada.'
            ),
            createGuardrail(
                'little-storytelling-language-growth',
                'little',
                'storytelling',
                'Puedes expandir vocabulario si el contexto visual ayuda a comprenderlo.'
            ),
            createGuardrail(
                'little-storytelling-brief-dialogue',
                'little',
                'storytelling',
                'El dialogo debe enriquecer, no duplicar, la accion principal.'
            ),
        ],
        visual: [
            createGuardrail(
                'little-visual-action',
                'little',
                'visual',
                'La ilustracion debe mostrar accion y emocion de forma comprensible sin leer todo el texto.'
            ),
            createGuardrail(
                'little-visual-support',
                'little',
                'visual',
                'El fondo puede enriquecer la escena siempre que mantenga claridad narrativa.'
            ),
        ],
    },
    reader: {
        narrative: [
            createGuardrail(
                'reader-narrative-full-arc',
                'reader',
                'narrative',
                'El cuento debe sostener inicio, nudo y desenlace con mayor inferencia y agencia del protagonista.'
            ),
            createGuardrail(
                'reader-narrative-consequence',
                'reader',
                'narrative',
                'La resolucion debe dejar una consecuencia emocional real y comprensible.'
            ),
        ],
        storytelling: [
            createGuardrail(
                'reader-storytelling-rich-but-clear',
                'reader',
                'storytelling',
                'Usa lenguaje mas rico, pero siempre legible para lector inicial con apoyo.'
            ),
            createGuardrail(
                'reader-storytelling-agency',
                'reader',
                'storytelling',
                'El protagonista debe resolver por iniciativa propia, no por rescate externo.'
            ),
            createGuardrail(
                'reader-storytelling-inference',
                'reader',
                'storytelling',
                'Permite inferencia moderada sin volver opaca la comprension basica.'
            ),
        ],
        visual: [
            createGuardrail(
                'reader-visual-complement',
                'reader',
                'visual',
                'La imagen debe complementar y expandir el texto, no solo repetirlo.'
            ),
            createGuardrail(
                'reader-visual-density',
                'reader',
                'visual',
                'Se permiten escenas mas ricas si la composicion mantiene foco y orientacion.'
            ),
        ],
    },
};

export function getEditorialGuardrails(
    agent: GuardrailAgent,
    ageGroup: AgeGroup
): EditorialGuardrail[] {
    return AGE_EDITORIAL_GUARDRAILS[ageGroup][agent];
}

export function formatEditorialGuardrails(
    agent: GuardrailAgent,
    ageGroup: AgeGroup
): string {
    return getEditorialGuardrails(agent, ageGroup)
        .map((guardrail) => `- ${guardrail.text}`)
        .join('\n');
}
