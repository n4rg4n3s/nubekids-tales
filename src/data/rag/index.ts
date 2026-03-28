/**
 * index.ts
 * Exporta todos los chunks RAG.
 * 
 * V1: Hardcodeados en archivos .ts
 * V2: Cargados desde Supabase pgvector
 */

import { neuroDevChunks } from './neuro-dev.chunks';
import { childPsychChunks } from './child-psych.chunks';
import { storytellingChunks } from './storytelling.chunks';
import type { RagChunk } from '../../types';

/**
 * Todos los chunks RAG combinados.
 * El ragService filtra por tags según la consulta.
 */
export const allChunks: RagChunk[] = [
    ...neuroDevChunks,
    ...childPsychChunks,
    ...storytellingChunks,
];

// Re-exportar chunks individuales por si se necesitan por separado
export { neuroDevChunks, childPsychChunks, storytellingChunks };

// Utilidad: obtener chunks por colección
export function getChunksByCollection(collection: string): RagChunk[] {
    return allChunks.filter(chunk => chunk.collection === collection);
}

// Utilidad: obtener todas las colecciones disponibles
export function getAvailableCollections(): string[] {
    const collections = new Set(allChunks.map(chunk => chunk.collection));
    return Array.from(collections);
}