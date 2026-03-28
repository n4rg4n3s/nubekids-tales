// src/dev/mockAgentBrief.ts
// AgentBrief pre-generado para desarrollo rápido

import type { AgentBrief } from '../types';

/**
 * AgentBrief de ejemplo: "Los Zapatos Mágicos de Luna"
 * Basado en un cuento real generado por el sistema.
 */
export const MOCK_AGENT_BRIEF: AgentBrief = {
    narrativeArc: `Luna, una niña curiosa de 6 años, descubre que sus nuevos zapatos tienen poderes mágicos. 
    Al principio tiene miedo de usarlos, pero con valentía aprende a confiar en sí misma. 
    El viaje emocional va de la inseguridad a la confianza, enseñando que la verdadera magia está en creer en uno mismo.`,

    storyBeats: [
        {
            scene: "Luna en su habitación mirando una caja de zapatos nuevos con curiosidad y algo de nerviosismo.",
            caption: "Luna abrió la caja con cuidado. Dentro había unos zapatos brillantes que parecían tener estrellitas.",
            dialogue: "¡Mamá, estos zapatos brillan!",
            choices: [],
            focus_char: 'hero',
        },
        {
            scene: "Luna poniéndose los zapatos mientras estos empiezan a emitir un brillo suave dorado.",
            caption: "Cuando Luna se puso los zapatos, sintió un cosquilleo en los pies. Los zapatos comenzaron a brillar más fuerte.",
            dialogue: null,
            choices: [],
            focus_char: 'hero',
        },
        {
            scene: "Luna flotando unos centímetros sobre el suelo de su habitación, con expresión de sorpresa y alegría.",
            caption: "¡Luna estaba flotando! Sus pies ya no tocaban el suelo. Los zapatos mágicos la elevaban suavemente.",
            dialogue: "¡Estoy volando! ¡No puedo creerlo!",
            choices: [],
            focus_char: 'hero',
        },
        {
            scene: "Luna volando por el jardín, pasando cerca de las flores y mariposas que la miran con curiosidad.",
            caption: "Luna salió al jardín volando. Las mariposas la seguían y las flores parecían saludarla con sus pétalos.",
            dialogue: null,
            choices: [],
            focus_char: 'hero',
        },
        {
            scene: "Luna encuentra un pajarito con el ala lastimada en una rama alta de un árbol.",
            caption: "En lo alto de un árbol, Luna vio un pajarito que no podía volar. Tenía su alita lastimada.",
            dialogue: "Pobrecito, no puede bajar. ¡Tengo que ayudarlo!",
            choices: ["Volar hasta el pajarito", "Buscar ayuda de mamá"],
            focus_char: 'hero',
        },
        {
            scene: "Luna volando suavemente hacia la rama donde está el pajarito, con los brazos extendidos con cuidado.",
            caption: "Luna respiró hondo y voló hacia la rama. Sus zapatos brillaron más fuerte, dándole confianza.",
            dialogue: null,
            choices: [],
            focus_char: 'hero',
        },
        {
            scene: "Luna sosteniendo al pajarito con mucho cuidado mientras desciende lentamente hacia el suelo.",
            caption: "Con mucho cuidado, Luna tomó al pajarito entre sus manos. Bajó despacio hasta llegar al suelo.",
            dialogue: "Tranquilo, pequeño. Ya estás a salvo.",
            choices: [],
            focus_char: 'hero',
        },
        {
            scene: "Mamá curando al pajarito mientras Luna observa con sus zapatos aún brillando suavemente.",
            caption: "Mamá ayudó a curar el ala del pajarito. Luna se sintió muy orgullosa de haber sido valiente.",
            dialogue: null,
            choices: [],
            focus_char: 'hero',
        },
        {
            scene: "El pajarito ya recuperado volando junto a Luna en el jardín, ambos felices.",
            caption: "Días después, el pajarito ya podía volar. Vino a visitar a Luna para darle las gracias.",
            dialogue: "¡Mira mamá, mi amigo ha vuelto!",
            choices: [],
            focus_char: 'hero',
        },
        {
            scene: "Luna sentada en el jardín al atardecer, con sus zapatos mágicos y el pajarito posado en su hombro.",
            caption: "Luna aprendió que la verdadera magia no estaba solo en los zapatos. Estaba en su corazón valiente.",
            dialogue: null,
            choices: [],
            focus_char: 'hero',
        },
    ],

    visualDirections: [
        "3D Animation Magic style illustration. A curious 6-year-old girl named Luna in her cozy bedroom, looking at a sparkly shoebox with wonder. Warm afternoon lighting, soft shadows, magical sparkles emanating from the box. Pixar-style rendering, vibrant colors.",
        "3D Animation Magic style illustration. Luna sitting on her bed putting on magical glowing sneakers that emit golden light. Her face shows amazement. Warm interior lighting with magical glow effects. Pixar-style, detailed textures.",
        "3D Animation Magic style illustration. Luna floating a few inches above her bedroom floor, arms slightly raised in surprise and joy. Her magical sneakers glow brightly. Dynamic pose, warm lighting, magical particles in the air.",
        "3D Animation Magic style illustration. Luna flying low through a colorful garden, butterflies following her. Flowers seem to wave at her. Bright daylight, vibrant colors, whimsical atmosphere. Pixar-style rendering.",
        "3D Animation Magic style illustration. Luna hovering near a tall tree branch where a small injured bird sits. Concerned expression on Luna's face. Golden hour lighting, emotional scene, soft shadows.",
        "3D Animation Magic style illustration. Luna flying carefully toward the tree branch, arms extended gently toward the injured bird. Her sneakers emit a confident golden glow. Dramatic lighting, heroic pose.",
        "3D Animation Magic style illustration. Luna descending slowly while carefully holding the small bird in her cupped hands. Protective pose, gentle expression. Soft lighting, magical particles trailing behind her sneakers.",
        "3D Animation Magic style illustration. Luna's mother gently caring for the bird's wing while Luna watches proudly, her magical sneakers still softly glowing. Warm indoor lighting, nurturing atmosphere.",
        "3D Animation Magic style illustration. The healed bird flying happily around Luna in the sunny garden. Both look joyful. Bright daylight, vibrant garden colors, celebratory mood.",
        "3D Animation Magic style illustration. Luna sitting peacefully in the garden at golden hour, the bird perched on her shoulder. Her magical sneakers rest beside her. Warm sunset lighting, peaceful atmosphere, soft shadows. Emotional ending scene.",
    ],
};

/**
 * Retorna una versión reducida del brief para pruebas más rápidas.
 */
export function getMockBrief(pageCount: number = 10): AgentBrief {
    return {
        narrativeArc: MOCK_AGENT_BRIEF.narrativeArc,
        storyBeats: MOCK_AGENT_BRIEF.storyBeats.slice(0, pageCount),
        visualDirections: MOCK_AGENT_BRIEF.visualDirections.slice(0, pageCount),
    };
}