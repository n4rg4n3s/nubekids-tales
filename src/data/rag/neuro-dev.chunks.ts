/**
 * neuro-dev.chunks.ts
 * Chunks de Neuroeducación y Desarrollo Infantil.
 * Fuentes: Piaget, Vygotsky, Gardner, investigación moderna.
 *
 * NOTA: Estos son chunks de ejemplo/placeholder.
 * Reemplazar con contenido real de los PDFs procesados.
 */

import type { RagChunk } from '../../types';

export const neuroDevChunks: RagChunk[] = [
    {
        id: 'neuro-000',
        collection: 'neuro-dev',
        tags: ['age:baby', 'technique:co-regulation', 'technique:sensory-language'],
        summary: 'En 0-3 años, el lenguaje funciona mejor como co-regulación y nombrado sensorial.',
        fullContent: `
Entre los 0-3 años, el adulto regula la experiencia emocional del niño a través de
la voz, el ritmo y la repetición. En un cuento, el lenguaje sirve para:

1. Nombrar lo visible y sensorial
2. Reforzar seguridad y previsibilidad
3. Asociar exploración con calma y celebración

TÉCNICA NARRATIVA: frases breves, melódicas y concretas.
Ejemplo: "Luna toca el agua. Agua fresca. Mamá sonríe. ¡Bravo, Luna!"
    `.trim(),
        source: 'Early childhood co-regulation - adapted reference.',
    },
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
        source: 'Piaget, J. (1952). The Origins of Intelligence in Children.',
    },
    {
        id: 'neuro-002',
        collection: 'neuro-dev',
        tags: ['age:little', 'topic:sharing', 'technique:perspective-taking'],
        summary: 'Entre 4-5 años emerge con más claridad la capacidad de ver perspectivas ajenas.',
        fullContent: `
Entre los 4-5 años, los niños comienzan a desarrollar "teoría de la mente" - 
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
        source: 'Vygotsky, L.S. (1978). Mind in Society.',
    },
    {
        id: 'neuro-003',
        collection: 'neuro-dev',
        tags: ['age:reader', 'topic:problem-solving', 'technique:metacognition'],
        summary: 'Los 5-7 años ya permiten modelar planificación y evaluación sencilla.',
        fullContent: `
Los niños de 5-7 años pueden beneficiarse de narrativas que modelen 
un proceso de pensamiento sencillo, no solo el resultado.

TÉCNICA NARRATIVA: El protagonista "piensa en voz alta" antes de actuar.
Ejemplo: "Marcos se detuvo a pensar. Tenía tres opciones: podía correr, 
podía esconderse, o podía usar sus zapatillas mágicas para volar. 
Cada opción tenía consecuencias diferentes..."

Esto desarrolla:
- Planificación antes de actuar
- Evaluación de consecuencias
- Flexibilidad cognitiva
    `.trim(),
        source: 'Flavell, J.H. (1979). Metacognition and Cognitive Monitoring.',
    },
    {
        id: 'neuro-004',
        collection: 'neuro-dev',
        tags: ['age:all', 'technique:repetition'],
        summary: 'La repetición estructurada refuerza el aprendizaje en todas las edades.',
        fullContent: `
La repetición con variación es una técnica universal en literatura infantil.
Los patrones predecibles dan seguridad mientras las variaciones mantienen interés.

TÉCNICA NARRATIVA: Usar estructuras repetitivas con cambios graduales.
Ejemplo: "Sus zapatos brillaron una vez... y saltó un charco pequeño.
Sus zapatos brillaron dos veces... y saltó un charco mediano.
Sus zapatos brillaron tres veces... ¡y saltó sobre el río entero!"

Beneficios por edad:
- Baby (0-3): Anticipa y se calma con patrones predecibles
- Tiny (3-4): Predice y participa activamente
- Little (4-5): Reconoce patrones y anticipa
- Reader (5-7): Empieza a disfrutar la progresión narrativa completa
    `.trim(),
        source: 'Bruner, J.S. (1990). Acts of Meaning.',
    },
];
