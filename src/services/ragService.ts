/**
 * RAG Service V2 — Semantic Search via Supabase pgvector
 * 
 * Replaces V1 tag-based filtering with vector similarity search.
 * Uses gemini-embedding-001 for query embeddings and Supabase RPC
 * for cosine similarity search against stored chunk embeddings.
 * 
 * Fallback: If Supabase is unreachable, falls back to V1 tag-based
 * filtering using local chunks (if still available).
 */

import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';
import type { AgeGroup, PedagogyProfile, RagChunk } from '../types';

// ─── Configuration ───────────────────────────────────────────

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;
const DEFAULT_MAX_CHUNKS = 5;
const SIMILARITY_THRESHOLD = 0.3; // Minimum similarity to include

// ─── Types ───────────────────────────────────────────────────

export interface RagQuery {
    ageGroup: AgeGroup;
    pedagogy?: PedagogyProfile;
    collections?: string[];
    maxChunks?: number;
}

interface SupabaseRagResult {
    id: string;
    collection: string;
    source: string;
    section_header: string | null;
    full_content: string;
    summary: string | null;
    tags: string[];
    similarity: number;
    token_count: number;
}

// ─── Query Embedding Generation ──────────────────────────────

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(apiKey: string): GoogleGenAI {
    if (!geminiClient) {
        geminiClient = new GoogleGenAI({ apiKey });
    }
    return geminiClient;
}

async function generateQueryEmbedding(
    query: string,
    apiKey: string
): Promise<number[]> {
    const client = getGeminiClient(apiKey);

    const response = await client.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: query,
        config: {
            outputDimensionality: EMBEDDING_DIMENSIONS,
            taskType: 'RETRIEVAL_QUERY',  // Optimized for queries (vs RETRIEVAL_DOCUMENT for chunks)
        },
    });

    return response.embeddings[0].values;
}

// ─── Build Semantic Query from Session Context ───────────────

function buildSemanticQuery(params: RagQuery): string {
    const parts: string[] = [];

    // Age group context
    const ageLabels: Record<AgeGroup, string> = {
        tiny: 'children aged 3-4 years, early childhood development',
        little: 'children aged 5-6 years, social-emotional learning',
        reader: 'children aged 7-10 years, cognitive development, moral reasoning',
    };
    parts.push(ageLabels[params.ageGroup]);

    // Pedagogy context
    if (params.pedagogy?.enabled) {
        if (params.pedagogy.behaviorChallenges?.length) {
            parts.push(`behavioral challenges: ${params.pedagogy.behaviorChallenges.join(', ')}`);
        }
        if (params.pedagogy.skillsToReinforce?.length) {
            parts.push(`skills to develop: ${params.pedagogy.skillsToReinforce.join(', ')}`);
        }
        if (params.pedagogy.emotionalContext?.length) {
            parts.push(`emotional context: ${params.pedagogy.emotionalContext.join(', ')}`);
        }
        if (params.pedagogy.valuesToTransmit?.length) {
            parts.push(`values: ${params.pedagogy.valuesToTransmit.join(', ')}`);
        }
        if (params.pedagogy.motivations?.length) {
            parts.push(`child interests: ${params.pedagogy.motivations.join(', ')}`);
        }
    }

    // Add storytelling context for storytelling collection
    parts.push('therapeutic storytelling techniques for children, narrative structure, character development');

    return parts.join('. ');
}

// ─── V2: Semantic Search via Supabase pgvector ───────────────

async function querySemanticV2(
    params: RagQuery,
    apiKey: string
): Promise<RagChunk[]> {
    if (!supabase) {
        throw new Error('Supabase client not configured');
    }

    const maxChunks = params.maxChunks || DEFAULT_MAX_CHUNKS;
    const semanticQuery = buildSemanticQuery(params);

    console.log('📚 RAG V2: Semantic query:', semanticQuery.slice(0, 100) + '...');

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(semanticQuery, apiKey);

    // Search each requested collection (or both by default)
    const collections = params.collections?.length
        ? params.collections
        : ['child-psych', 'storytelling'];

    const allResults: SupabaseRagResult[] = [];

    for (const collection of collections) {
        const { data, error } = await supabase.rpc('match_rag_chunks', {
            query_embedding: queryEmbedding,
            match_count: maxChunks,
            filter_collection: collection,
        });

        if (error) {
            console.warn(`⚠️ RAG V2 search error for ${collection}:`, error.message);
        } else if (data) {
            allResults.push(...data);
        }
    }

    // Sort by similarity, filter by threshold, limit
    const filtered = allResults
        .filter(r => r.similarity >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxChunks);

    console.log(`   → ${filtered.length} chunks found (best similarity: ${filtered[0]?.similarity?.toFixed(3) || 'N/A'})`);

    // Convert to RagChunk format (compatible with existing agents)
    return filtered.map(r => ({
        id: r.id,
        collection: r.collection,
        tags: r.tags,
        summary: r.summary || '',
        fullContent: r.full_content,
        source: r.source,
    }));
}

// ─── V1 Fallback: Tag-based filtering ────────────────────────

function buildTagsFromQuery(
    ageGroup: AgeGroup,
    pedagogy?: PedagogyProfile
): string[] {
    const tags: string[] = [];
    tags.push(`age:${ageGroup}`);
    tags.push('age:all');

    if (pedagogy?.enabled) {
        pedagogy.behaviorChallenges?.forEach(c => tags.push(`topic:${c}`));
        pedagogy.skillsToReinforce?.forEach(s => tags.push(`skill:${s}`));
        pedagogy.emotionalContext?.forEach(e => tags.push(`emotion:${e}`));
        pedagogy.valuesToTransmit?.forEach(v => tags.push(`value:${v}`));
    }

    return tags;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Query the RAG knowledge base.
 * Uses V2 semantic search (Supabase pgvector) if available,
 * falls back to V1 tag-based filtering otherwise.
 */
export async function queryRag(
    params: RagQuery,
    apiKey?: string
): Promise<RagChunk[]> {
    // Try V2 semantic search first
    if (supabase && apiKey) {
        try {
            return await querySemanticV2(params, apiKey);
        } catch (err) {
            console.warn('⚠️ RAG V2 failed, falling back to V1:', (err as Error).message);
        }
    }

    // V1 fallback: import local chunks
    try {
        const { allChunks } = await import('../data/rag');
        const relevantTags = buildTagsFromQuery(params.ageGroup, params.pedagogy);
        const maxChunks = params.maxChunks || DEFAULT_MAX_CHUNKS;

        let filtered = allChunks;

        if (params.collections?.length) {
            filtered = filtered.filter(chunk =>
                params.collections!.includes(chunk.collection)
            );
        }

        filtered = filtered.filter(chunk =>
            chunk.tags.some(tag => relevantTags.includes(tag))
        );

        filtered.sort((a, b) => {
            const aMatches = a.tags.filter(t => relevantTags.includes(t)).length;
            const bMatches = b.tags.filter(t => relevantTags.includes(t)).length;
            return bMatches - aMatches;
        });

        console.log(`📚 RAG V1 fallback: ${filtered.length} chunks found by tags`);
        return filtered.slice(0, maxChunks);
    } catch {
        console.warn('⚠️ RAG V1 fallback also failed. No RAG context available.');
        return [];
    }
}

/**
 * Format chunks for injection into agent prompts.
 * Compatible with both V1 and V2 chunks.
 */
export function formatChunksForPrompt(chunks: RagChunk[]): string {
    if (chunks.length === 0) return '';

    return chunks
        .map(chunk => `[${chunk.source}]:\n${chunk.fullContent}`)
        .join('\n\n---\n\n');
}