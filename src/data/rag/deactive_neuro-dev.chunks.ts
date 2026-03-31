// src/data/rag/neuro-dev.chunks.ts

import type { RagChunk } from '../../types';
export const neuroDevChunks: RagChunk[] = [
    {
        id: 'neuro-1',
        collection: 'neuro-dev',
        tags: ['age:tiny', 'topic:tantrums', 'technique:emotion-naming'],
        summary: 'A los 3-4 años, los niños carecen de vocabulario emocional completo.',
        fullContent: `
      Los niños de 3-4 años experimentan emociones intensas pero carecen del 
      vocabulario para expresarlas. Nombrar las emociones en cuentos ayuda a:
      1. Desarrollar conciencia emocional
      2. Proveer lenguaje para futuras situaciones
      3. Normalizar sentimientos difíciles
      
      Técnica narrativa: Usar frases como "El héroe se sintió frustrado porque..."
    `,
        source: 'Piaget, J. (1952). The Origins of Intelligence in Children.'
    },
    // ... más chunks
];