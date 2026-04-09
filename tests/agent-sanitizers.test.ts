import test from 'node:test';
import assert from 'node:assert/strict';

import { parseJsonSafely } from '../src/utils/jsonParser.ts';
import { buildSemanticQuery, resolveMaxChunks } from '../src/services/ragService.ts';
import { generateArc } from '../src/services/agents/narrativeAgent.ts';
import { generateBeats } from '../src/services/agents/storytellingAgent.ts';

import type { AgentDependencies } from '../src/services/dependencies.ts';
import type { PedagogyProfile, RagChunk } from '../src/types.ts';

function createMockDeps(responseText: string, ragChunks: RagChunk[] = []): AgentDependencies {
    return {
        ragChunks,
        geminiClient: {
            models: {
                generateContent: async () => ({ text: responseText }),
            },
        },
    } as unknown as AgentDependencies;
}

function createPedagogyProfile(overrides: Partial<PedagogyProfile> = {}): PedagogyProfile {
    return {
        enabled: false,
        behaviorChallenges: [],
        skillsToReinforce: [],
        emotionalContext: [],
        motivations: [],
        valuesToTransmit: [],
        freeformContext: '',
        customBehavior: '',
        customSkill: '',
        customEmotion: '',
        customMotivation: '',
        customValue: '',
        ...overrides,
    };
}

test('parseJsonSafely repairs keyMoments pseudo-object arrays', () => {
    const malformedResponse = `{
      "pedagogicalObjective": "Objetivo breve",
      "keyMoments": [
        "momento_inicio": "Sara juega con su varita.",
        "problema": "Las pompas no salen."
      ]
    }`;

    const parsed = parseJsonSafely<{
        pedagogicalObjective: string;
        keyMoments: Record<string, string>;
    }>(malformedResponse);

    assert.equal(parsed.pedagogicalObjective, 'Objetivo breve');
    assert.deepEqual(parsed.keyMoments, {
        momento_inicio: 'Sara juega con su varita.',
        problema: 'Las pompas no salen.',
    });
});

test('generateArc strips didactic conclusions from the expert brief surface', async () => {
    const narrativeResponse = JSON.stringify({
        pedagogicalObjective: 'Ayudar a Sara a pedir ayuda.',
        emotionalObjective: 'Pasar de la frustración a la calma.',
        coreMessage: 'Ha aprendido que pedir ayuda puede traer calma.',
        storyArcSummary: 'Sara se frustra con la varita. Ha aprendido que pedir ayuda cambia todo.',
        keyMoments: {
            momento_inicio: 'Sara mira pompas de colores en el jardín.',
            problema: 'La varita no saca pompas y Sara frunce el ceño.',
            descubrimiento_magia: 'La varita emite un brillo suave.',
            punto_decision: 'Sara decide mirar a un adulto cercano.',
            climax: 'Con una ayuda breve, las pompas comienzan a subir.',
            resolucion: 'Sara ríe. Ha aprendido que con paciencia y ayuda las cosas salen mejor.',
        },
        magicItemRole: 'La varita responde cuando Sara baja el ritmo.',
        ageRationale: 'Reto pequeño y concreto para tiny.',
        languageGuidance: ['Frases cortas.'],
        narrativeGuidance: ['Acciones visibles.'],
        avoidPatterns: ['No moralizar.'],
        visualGuidance: ['Pompas grandes y coloridas.'],
    });

    const brief = await generateArc(
        {
            heroName: 'Sara',
            itemLabel: 'objeto especial',
            itemInteractionMode: 'generic',
            itemDescription: 'varita de burbujas',
            ageGroup: 'tiny',
            pedagogyProfile: createPedagogyProfile({ enabled: true, customSkill: 'Pedir ayuda' }),
            baseSystemPrompt: '',
        },
        createMockDeps(narrativeResponse, [
            {
                id: 'chunk-1',
                collection: 'child-psych',
                source: 'Fuente experta',
                summary: '',
                fullContent: 'La co-regulación y la petición de ayuda deben verse en acción.',
                tags: [],
            },
        ])
    );

    assert.doesNotMatch(brief.coreMessage, /ha\s+aprendido\s+que/i);
    assert.doesNotMatch(brief.storyArcSummary, /ha\s+aprendido\s+que/i);
    assert.match(brief.storyArcSummary, /Sara se frustra con la varita/i);
    assert.equal(
        brief.keyMoments.find((entry) => entry.startsWith('resolucion:'))?.includes('ha aprendido que'),
        false
    );
});

test('generateBeats keeps branching only in choices and softens moralized endings', async () => {
    const beatsResponse = JSON.stringify([
        { scene: 'cover', caption: 'La Aventura de Sara', dialogue: null, choices: [], focus_char: 'hero' },
        { scene: 'p2', caption: 'Sara veía pompas en el aire.', dialogue: null, choices: [], focus_char: 'hero' },
        { scene: 'p3', caption: 'Tomó su varita brillante.', dialogue: null, choices: [], focus_char: 'hero' },
        { scene: 'p4', caption: 'Sopló y las pompas no salieron.', dialogue: null, choices: [], focus_char: 'hero' },
        { scene: 'p5', caption: 'Sara se enfadó un poquito.', dialogue: null, choices: [], focus_char: 'hero' },
        {
            scene: 'p6',
            caption: 'La varita brilló. ¿Qué podía hacer Sara ahora?',
            dialogue: null,
            choices: ['Soplar otra vez', 'Pedir ayuda'],
            focus_char: 'hero',
        },
        {
            scene: 'p7',
            caption: 'O Sara buscó la mano de un adulto.',
            dialogue: null,
            choices: ['Elección accidental'],
            focus_char: 'hero',
        },
        { scene: 'p8', caption: 'El adulto sonrió y mostró un truco.', dialogue: null, choices: [], focus_char: 'hero' },
        { scene: 'p9', caption: 'Las pompas llenaron el aire de colores.', dialogue: null, choices: [], focus_char: 'hero' },
        {
            scene: 'p10',
            caption: 'Sara reía. Comprendió que la paciencia hacía la magia más fuerte.',
            dialogue: null,
            choices: [],
            focus_char: 'hero',
        },
    ]);

    const beats = await generateBeats(
        {
            expertBrief: {
                pedagogicalObjective: 'Trabajar paciencia y ayuda.',
                emotionalObjective: 'Pasar de frustración a alegría.',
                coreMessage: 'La magia aparece cuando baja el ritmo.',
                storyArcSummary: 'Sara se frustra y luego encuentra una salida con ayuda.',
                keyMoments: [],
                magicItemRole: 'La varita guía el cambio.',
                ageRationale: 'tiny necesita un reto pequeño y claro.',
                languageGuidance: ['Frases cortas.'],
                narrativeGuidance: ['Una emoción por página.'],
                avoidPatterns: ['No moralizar.'],
                visualGuidance: ['Pompas grandes y legibles.'],
            },
            ageGroup: 'tiny',
            pedagogyProfile: createPedagogyProfile(),
            language: 'Español',
            genre: '3D Animation Magic',
            heroName: 'Sara',
            itemLabel: 'objeto especial',
            itemInteractionMode: 'generic',
            itemDescription: 'varita de burbujas',
        },
        createMockDeps(beatsResponse)
    );

    assert.equal(beats[5]?.choices.length, 2);
    assert.deepEqual(beats[6]?.choices, []);
    assert.equal(beats[6]?.caption, 'Sara buscó la mano de un adulto.');
    assert.doesNotMatch(beats[9]?.caption ?? '', /comprendi[oó]\s+que/i);
    assert.equal(beats[9]?.caption, 'Sara reía.');
});

test('resolveMaxChunks grows with age and richer pedagogy signals', () => {
    assert.equal(resolveMaxChunks({ ageGroup: 'baby' }), 4);
    assert.equal(resolveMaxChunks({ ageGroup: 'tiny' }), 5);
    assert.equal(resolveMaxChunks({ ageGroup: 'little' }), 6);
    assert.equal(resolveMaxChunks({ ageGroup: 'reader' }), 7);

    assert.equal(
        resolveMaxChunks({
            ageGroup: 'tiny',
            pedagogy: createPedagogyProfile({
                enabled: true,
                customBehavior: 'frustracion',
            }),
        }),
        6
    );

    assert.equal(
        resolveMaxChunks({
            ageGroup: 'reader',
            pedagogy: createPedagogyProfile({
                enabled: true,
                behaviorChallenges: ['miedo a equivocarse'],
                skillsToReinforce: ['resolver problemas'],
                emotionalContext: ['se bloquea'],
                customMotivation: 'inventos',
            }),
        }),
        9
    );
});

test('buildSemanticQuery includes custom Step 2 fields in the semantic retrieval prompt', () => {
    const query = buildSemanticQuery({
        ageGroup: 'little',
        pedagogy: createPedagogyProfile({
            enabled: true,
            customBehavior: 'ansiedad por separacion',
            customSkill: 'autonomia',
            customEmotion: 'separacion de los padres',
            customMotivation: 'animales',
            customValue: 'valentia',
            freeformContext: 'le calma jugar con su perro',
        }),
    });

    assert.match(query, /ansiedad por separacion/i);
    assert.match(query, /autonomia/i);
    assert.match(query, /separacion de los padres/i);
    assert.match(query, /animales/i);
    assert.match(query, /valentia/i);
    assert.match(query, /le calma jugar con su perro/i);
});
