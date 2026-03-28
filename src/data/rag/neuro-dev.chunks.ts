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
        summary: 'A los 5-6 años emerge la capacidad de ver perspectivas ajenas.',
        fullContent: `
Entre los 5-6 años, los niños comienzan a desarrollar "teoría de la mente" - 
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
        summary: 'Los 7-10 años es ideal para introducir pensamiento metacognitivo.',
        fullContent: `
Los niños de 7-10 años pueden beneficiarse de narrativas que modelen 
el proceso de pensamiento, no solo el resultado.

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
- Tiny (3-4): Predice y participa activamente
- Little (5-6): Reconoce patrones y anticipa
- Reader (7-10): Aprecia la estructura narrativa
    `.trim(),
        source: 'Bruner, J.S. (1990). Acts of Meaning.',
    },
];