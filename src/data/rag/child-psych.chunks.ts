/**
 * child-psych.chunks.ts
 * Chunks de Psicología Infantil y Conducta.
 * Fuentes: Teorías del apego, bibliotherapy, inteligencia emocional.
 *
 * NOTA: Estos son chunks de ejemplo/placeholder.
 * Reemplazar con contenido real de los PDFs procesados.
 */

import type { RagChunk } from '../../types';

export const childPsychChunks: RagChunk[] = [
    {
        id: 'psych-000',
        collection: 'child-psych',
        tags: ['age:baby', 'emotion:separation', 'technique:attachment'],
        summary: 'En 0-3 años funcionan mejor narrativas de apego, rutina y regreso seguro.',
        fullContent: `
En 0-3 años, las historias más útiles son las que refuerzan seguridad,
rituales y regreso seguro al adulto de referencia.

TÉCNICA NARRATIVA:
1. Presentar al protagonista acompañado
2. Explorar algo pequeño y amable
3. Volver a un abrazo, una mirada o una rutina conocida

El objeto mágico debe acompañar, no dramatizar. La clave es transmitir:
"explorar es seguro y siempre hay un lugar al que volver".
    `.trim(),
        source: 'Attachment-informed storytelling - adapted reference.',
    },
    {
        id: 'psych-001',
        collection: 'child-psych',
        tags: ['age:tiny', 'topic:night-fears', 'technique:bibliotherapy'],
        summary: 'Los miedos nocturnos son normales a los 3-4 años y responden bien a la bibliotherapy.',
        fullContent: `
Los miedos nocturnos alcanzan su pico entre los 3-5 años. La bibliotherapy 
(uso terapéutico de historias) es especialmente efectiva porque:

1. Externaliza el miedo en un personaje seguro
2. Modela estrategias de afrontamiento
3. Da control al niño a través de la narrativa

TÉCNICA NARRATIVA: El objeto mágico (zapatos/prenda) se convierte en 
protector nocturno. "Cuando Luna tenía miedo de la oscuridad, sus zapatillas 
brillaban suavemente, como una luna pequeñita solo para ella."

IMPORTANTE: Nunca ridiculizar el miedo. Validar primero, luego resolver.
    `.trim(),
        source: 'Bettelheim, B. (1976). The Uses of Enchantment.',
    },
    {
        id: 'psych-002',
        collection: 'child-psych',
        tags: ['age:little', 'topic:sibling-rivalry', 'emotion:new-sibling'],
        summary: 'Los celos de hermanos requieren validación emocional y rol activo del protagonista.',
        fullContent: `
La llegada de un hermano genera sentimientos ambivalentes normales.
El error común es negar los celos o forzar amor inmediato.

TÉCNICA NARRATIVA: Permitir que el protagonista sienta celos, luego 
descubra su propio valor único. El objeto mágico puede revelar 
"poderes especiales" que solo el hermano mayor tiene.

Ejemplo: "Pablo se sentía invisible desde que llegó el bebé. Pero sus 
zapatos mágicos le mostraron algo: solo ÉL podía hacer reír al bebé 
con sus saltos locos. Era su superpoder de hermano mayor."

Evitar: Moralizar sobre "deber" querer al hermano.
Buscar: Que el niño descubra beneficios genuinos de su nuevo rol.
    `.trim(),
        source: 'Faber, A. & Mazlish, E. (1987). Siblings Without Rivalry.',
    },
    {
        id: 'psych-003',
        collection: 'child-psych',
        tags: ['age:all', 'topic:tantrums', 'skill:autonomy'],
        summary: 'Las rabietas son intentos de autonomía; el cuento puede modelar alternativas.',
        fullContent: `
Las rabietas no son manipulación sino sobrecarga emocional combinada 
con deseo de autonomía. Los cuentos pueden:

1. Normalizar la emoción intensa
2. Mostrar que pedir ayuda es válido
3. Ofrecer alternativas al estallido

TÉCNICA NARRATIVA para cada edad:
- Baby: El adulto co-regula con palabras suaves y repetitivas. El foco es calmar, no razonar.
- Tiny: "Tomás sintió un volcán en su panza. Sus zapatos le susurraron: 
  respira hondo, cuenta hasta tres."
- Little: El protagonista prueba gritar, no funciona. Prueba pedir ayuda, funciona.
- Reader: El protagonista reflexiona sobre qué desencadenó su frustración.

CLAVE: El objeto mágico NO elimina la emoción. Ayuda a GESTIONARLA.
    `.trim(),
        source: 'Siegel, D.J. & Bryson, T.P. (2012). The Whole-Brain Child.',
    },
    {
        id: 'psych-004',
        collection: 'child-psych',
        tags: ['age:reader', 'emotion:parents-divorce', 'technique:narrative-reframe'],
        summary: 'Entre 5-7 años, el divorcio requiere narrativas que preserven seguridad y eviten culpa.',
        fullContent: `
Los niños de 5-7 años también pueden internalizar culpa por el divorcio de sus padres.
La narrativa debe:

1. Separar claramente: "Esto NO es tu culpa"
2. Mantener ambos padres como figuras positivas
3. Mostrar que el amor hacia el niño no cambia

TÉCNICA NARRATIVA: El objeto mágico puede ser un "puente" simbólico.
"Los zapatos de Marina podían llevarla volando de una casa a otra. 
Y lo mejor: en las dos casas, sus zapatos brillaban igual de fuerte, 
porque el amor de mamá y papá vivía en los dos lugares."

EVITAR: Tomar partido, prometer reconciliación, o usar al niño como mensajero.
    `.trim(),
        source: 'Emery, R.E. (2004). The Truth About Children and Divorce.',
    },
    {
        id: 'psych-005',
        collection: 'child-psych',
        tags: ['age:all', 'value:empathy', 'technique:perspective-shift'],
        summary: 'La empatía se desarrolla mejor a través de experiencias vicarias en historias.',
        fullContent: `
La empatía tiene componentes cognitivos (entender) y afectivos (sentir).
Los cuentos desarrollan ambos de forma segura.

TÉCNICA NARRATIVA: Momentos donde el objeto mágico permite "ver" 
o "sentir" lo que otro personaje experimenta.

Por edad:
- Baby: "Sus zapatos brillaron y Pablo notó la carita triste de su amigo."
- Tiny: "Sus zapatos brillaron y Pablo SINTIÓ la tristeza de su amigo."
- Little: "Los zapatos le mostraron el mundo desde los ojos de María."
- Reader: El protagonista debe elegir entre su beneficio y ayudar a otro.

La clave es que el protagonista ACTÚE basándose en esa comprensión,
no solo que la tenga. La empatía sin acción es incompleta.
    `.trim(),
        source: 'Hoffman, M.L. (2000). Empathy and Moral Development.',
    },
];
