/**
 * storytelling.chunks.ts
 * Chunks de Storytelling y Escritura Creativa Infantil.
 * Fuentes: Técnicas narrativas, estructuras por edad, maestros del género.
 *
 * NOTA: Estos son chunks de ejemplo/placeholder.
 * Reemplazar con contenido real de los PDFs procesados.
 */

import type { RagChunk } from '../../types';

export const storytellingChunks: RagChunk[] = [
    {
        id: 'story-001',
        collection: 'storytelling',
        tags: ['age:tiny', 'technique:structure'],
        summary: 'Para 3-4 años: estructura lineal, máximo 3 eventos, final claro.',
        fullContent: `
La estructura narrativa para niños de 3-4 años debe ser LINEAL y SIMPLE:

1. INICIO: Presentar al héroe y su situación (1-2 páginas)
2. PROBLEMA: Un obstáculo simple y concreto (1 página)
3. MAGIA: El objeto mágico ayuda (2-3 páginas)
4. RESOLUCIÓN: Final feliz y claro (1-2 páginas)

REGLAS DE ESCRITURA:
- Máximo 20 palabras por página
- Frases: Sujeto + Verbo + Complemento
- Onomatopeyas: ¡ZOOM! ¡PUM! ¡SPLASH!
- Repetición: "Saltó una vez. Saltó dos veces. Saltó tres veces."
- Tiempo presente o pasado simple, nunca condicional

EJEMPLO: "Luna tenía sed. No alcanzaba la fuente. 
¡BRILLARON sus zapatos! Saltó muy alto. 
Bebió agua fresquita. ¡Qué feliz estaba Luna!"
    `.trim(),
        source: 'Fox, M. (2001). Reading Magic.',
    },
    {
        id: 'story-002',
        collection: 'storytelling',
        tags: ['age:little', 'technique:structure'],
        summary: 'Para 5-6 años: arco simple con problema-intento-solución.',
        fullContent: `
Los niños de 5-6 años pueden seguir un arco narrativo con MÁS COMPLEJIDAD:

ESTRUCTURA RECOMENDADA:
1. MUNDO ORDINARIO: Héroe en su vida normal (1-2 páginas)
2. PROBLEMA: Algo cambia o aparece un desafío (1-2 páginas)
3. PRIMER INTENTO: Falla sin la magia (1 página)
4. DESCUBRIMIENTO: El objeto mágico revela su poder (2 páginas)
5. AVENTURA: Usando la magia, enfrenta el problema (2-3 páginas)
6. RESOLUCIÓN: Éxito + lección aprendida (1-2 páginas)

REGLAS DE ESCRITURA:
- Máximo 50 palabras por página
- Introducir diálogo simple: "¡Puedo hacerlo!", gritó Pablo.
- Conectores básicos: entonces, pero, porque, después
- Emociones nombradas: "Sintió miedo, pero también curiosidad."
- Adjetivos descriptivos: zapatos brillantes, salto gigante
    `.trim(),
        source: 'Lukens, R.J. (2006). A Critical Handbook of Children\'s Literature.',
    },
    {
        id: 'story-003',
        collection: 'storytelling',
        tags: ['age:reader', 'technique:structure'],
        summary: 'Para 7-10 años: arco complejo con subtramas y dilemas.',
        fullContent: `
Los lectores de 7-10 años disfrutan COMPLEJIDAD NARRATIVA:

ESTRUCTURA AVANZADA:
1. GANCHO: Inicio intrigante que plantea una pregunta (1 página)
2. MUNDO ORDINARIO: Contexto del héroe con detalles ricos (2 páginas)
3. INCIDENTE INCITADOR: El catalizador del cambio (1-2 páginas)
4. COMPLICACIONES: Obstáculos crecientes, no todo es fácil (3-4 páginas)
5. PUNTO DE DECISIÓN: Dilema moral o elección difícil (1-2 páginas)
6. CLÍMAX: Momento de máxima tensión (1-2 páginas)
7. RESOLUCIÓN: Consecuencias + transformación del héroe (2 páginas)

REGLAS DE ESCRITURA:
- Hasta 120 palabras por página
- Vocabulario rico: en lugar de "feliz", usar "radiante", "eufórico"
- Metáforas simples: "Su corazón era un tambor"
- Subtexto en diálogos: lo que dicen vs. lo que sienten
- Giros narrativos: sorpresas que recontextualizan
    `.trim(),
        source: 'Vogler, C. (2007). The Writer\'s Journey.',
    },
    {
        id: 'story-004',
        collection: 'storytelling',
        tags: ['age:all', 'technique:object-magic'],
        summary: 'El objeto mágico debe tener reglas consistentes y limitaciones.',
        fullContent: `
El objeto mágico (zapatos, prenda) NO debe ser todopoderoso.
Las LIMITACIONES hacen la magia interesante y la historia significativa.

PRINCIPIOS DEL OBJETO MÁGICO:
1. ACTIVACIÓN: ¿Qué lo activa? (Deseo genuino, necesidad de otros, valentía)
2. LIMITACIÓN: ¿Qué NO puede hacer? (No puede forzar a otros, no funciona para egoísmo)
3. COSTE: ¿Requiere algo del héroe? (Valentía, empatía, esfuerzo)
4. CONSISTENCIA: Las reglas no cambian arbitrariamente

EJEMPLOS POR TIPO DE MAGIA:
- Zapatos que brillan cuando el héroe siente empatía
- Abrigo que protege del frío emocional (soledad, miedo)
- Mochila que guarda no cosas, sino recuerdos felices

ANTI-PATRÓN: El objeto resuelve todo sin esfuerzo del héroe.
PATRÓN CORRECTO: El objeto AMPLIFICA las virtudes del héroe.
    `.trim(),
        source: 'Nikolajeva, M. (2005). Aesthetic Approaches to Children\'s Literature.',
    },
    {
        id: 'story-005',
        collection: 'storytelling',
        tags: ['age:all', 'technique:dialogue'],
        summary: 'El diálogo infantil debe sonar natural y revelar personalidad.',
        fullContent: `
El diálogo en cuentos infantiles tiene funciones específicas:

FUNCIONES DEL DIÁLOGO:
1. Revelar personalidad (cómo habla = quién es)
2. Avanzar la trama (información necesaria)
3. Crear ritmo (romper bloques de narración)
4. Modelar comunicación (cómo resolver conflictos)

POR EDAD:
- Tiny: Exclamaciones cortas. "¡Mira!" "¡No puedo!" "¡Sí puedo!"
- Little: Frases completas simples. "Yo quiero ayudarte, pero tengo miedo."
- Reader: Subtexto. "Está bien, no importa" (cuando SÍ importa).

TÉCNICAS:
- Cada personaje tiene su "voz" única
- Evitar diálogos expositivos ("Como sabes, María, tú eres mi hermana...")
- Usar acciones entre diálogos: Pablo miró sus zapatos. "Tal vez..."
- Los niños no hablan como adultos pequeños
    `.trim(),
        source: 'Sendak, M. (1988). Caldecott & Co.: Notes on Books and Pictures.',
    },
    {
        id: 'story-006',
        collection: 'storytelling',
        tags: ['age:all', 'technique:show-not-tell'],
        summary: 'Mostrar emociones a través de acciones, no solo nombrarlas.',
        fullContent: `
"Show, don't tell" adaptado para literatura infantil:

TELL (evitar): "Pablo estaba muy enojado."
SHOW (preferir): "Pablo apretó los puños. Su cara se puso roja como un tomate."

POR EDAD:
- Tiny: Mostrar CON nombrar. "Luna frunció el ceño. Estaba confundida."
- Little: Mostrar primero, nombrar después. "Le temblaban las rodillas. 
  Eso era miedo, ¿verdad?"
- Reader: Mostrar sin nombrar. El lector infiere la emoción.

TÉCNICAS PARA "MOSTRAR":
- Sensaciones físicas: corazón rápido, manos sudadas, nudo en la garganta
- Acciones involuntarias: morderse el labio, apartar la mirada
- Cambios en el entorno: el sol pareció esconderse cuando ella lloró
- Reacciones de otros: "¿Estás bien?", preguntó mamá al ver su cara

El objeto mágico puede REFLEJAR emociones: brilla más con alegría, 
se apaga con tristeza, tiembla con miedo.
    `.trim(),
        source: 'Dahl, R. (1984). Boy: Tales of Childhood.',
    },
];