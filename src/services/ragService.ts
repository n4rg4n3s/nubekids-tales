/**
 * ragService.ts
 * RAG Service V1 - Filtrado por tags.
 * Sin vector DB, suficiente para MVP.
 *
 * V2: Migrar a Supabase pgvector + gemini-embedding-001
 */

import type { AgeGroup, PedagogyProfile, RagChunk } from '../types';
import { allChunks } from '../data/rag';

/**
 * Parámetros para consultar el RAG.
 */
export interface RagQueryParams {
    ageGroup: AgeGroup;
    pedagogy?: PedagogyProfile;
    collections?: string[];
    maxChunks?: number;
}

/**
 * Consulta el RAG y retorna los chunks más relevantes.
 * V1: Filtrado por tags (sin embeddings).
 */
export function queryRag(params: RagQueryParams): RagChunk[] {
    const { ageGroup, pedagogy, collections, maxChunks = 5 } = params;

    // Construir tags relevantes desde la consulta
    const relevantTags = buildTagsFromQuery(ageGroup, pedagogy);

    // Filtrar chunks
    let filtered = [...allChunks];

    // Filtrar por colección si se especifica
    if (collections && collections.length > 0) {
        filtered = filtered.filter(chunk =>
            collections.includes(chunk.collection)
        );
    }

    // Filtrar por tags (al menos un tag debe coincidir)
    filtered = filtered.filter(chunk =>
        chunk.tags.some(tag => relevantTags.includes(tag))
    );

    // Ordenar por relevancia (más tags coincidentes = más relevante)
    filtered.sort((a, b) => {
        const aMatches = a.tags.filter(t => relevantTags.includes(t)).length;
        const bMatches = b.tags.filter(t => relevantTags.includes(t)).length;
        return bMatches - aMatches;
    });

    // Limitar resultados
    return filtered.slice(0, maxChunks);
}

/**
 * Construye la lista de tags relevantes basándose en el AgeGroup y PedagogyProfile.
 */
function buildTagsFromQuery(
    ageGroup: AgeGroup,
    pedagogy?: PedagogyProfile
): string[] {
    const tags: string[] = [];

    // Tag por edad
    tags.push(`age:${ageGroup}`);
    tags.push('age:all'); // Chunks aplicables a todas las edades

    // Tags por pedagogía (si está habilitada)
    if (pedagogy?.enabled) {
        // Retos de comportamiento
        pedagogy.behaviorChallenges?.forEach(challenge => {
            tags.push(`topic:${challenge}`);
        });

        // Habilidades a reforzar
        pedagogy.skillsToReinforce?.forEach(skill => {
            tags.push(`skill:${skill}`);
        });

        // Contexto emocional
        pedagogy.emotionalContext?.forEach(context => {
            tags.push(`emotion:${context}`);
        });

        // Valores a transmitir
        pedagogy.valuesToTransmit?.forEach(value => {
            tags.push(`value:${value}`);
        });

        // Motivaciones
        pedagogy.motivations?.forEach(motivation => {
            tags.push(`motivation:${motivation}`);
        });
    }

    // Tags de técnicas generales (siempre útiles)
    tags.push('technique:structure');
    tags.push('technique:object-magic');

    return tags;
}

/**
 * Formatea chunks para inyectar en el prompt de un agente.
 * Retorna string vacío si no hay chunks.
 */
export function formatChunksForPrompt(chunks: RagChunk[]): string {
    if (chunks.length === 0) return '';

    const header = '=== CONTEXTO CIENTÍFICO-PEDAGÓGICO ===\n';
    const footer = '\n=== FIN CONTEXTO ===';

    const content = chunks
        .map(chunk => `[${chunk.source}]:\n${chunk.fullContent}`)
        .join('\n\n---\n\n');

    return header + content + footer;
}

/**
 * Obtiene un resumen de los chunks disponibles.
 * Útil para debugging.
 */
export function getRagStats(): {
    totalChunks: number;
    byCollection: Record<string, number>;
    byAgeGroup: Record<string, number>;
} {
    const byCollection: Record<string, number> = {};
    const byAgeGroup: Record<string, number> = {};

    allChunks.forEach(chunk => {
        // Contar por colección
        byCollection[chunk.collection] = (byCollection[chunk.collection] || 0) + 1;

        // Contar por age group
        chunk.tags.forEach(tag => {
            if (tag.startsWith('age:')) {
                const age = tag.replace('age:', '');
                byAgeGroup[age] = (byAgeGroup[age] || 0) + 1;
            }
        });
    });

    return {
        totalChunks: allChunks.length,
        byCollection,
        byAgeGroup,
    };
}