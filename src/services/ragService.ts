/**
 * RAG Service V2 — Semantic Search via Supabase pgvector
 *
 * Replaces V1 tag-based filtering with vector similarity search.
 * Uses the Gemini client already inicialized in AgentDependencies and
 * Supabase RPC for cosine similarity search against stored chunk embeddings.
 *
 * Fallback: If Supabase is unreachable, falls back to V1 tag-based
 * filtering using local chunks (if still available).
 */

import type { AgentDependencies } from './dependencies';
import type { AgeGroup, PedagogyProfile, RagChunk } from '../types';

// ─── Configuration ───────────────────────────────────────────

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;
const DEFAULT_MAX_CHUNKS = 5;
const SIMILARITY_THRESHOLD = 0.3;

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

async function generateQueryEmbedding(
  query: string,
  deps: AgentDependencies
): Promise<number[]> {
  const response = await deps.geminiClient.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: query,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      taskType: 'RETRIEVAL_QUERY',
    },
  });

  return response.embeddings?.[0]?.values ?? [];
}

// ─── Build Semantic Query from Session Context ───────────────

function buildSemanticQuery(params: RagQuery): string {
  const parts: string[] = [];

  const ageLabels: Record<AgeGroup, string> = {
    tiny: 'children aged 3-4 years, early childhood development',
    little: 'children aged 5-6 years, social-emotional learning',
    reader: 'children aged 7-10 years, cognitive development, moral reasoning',
  };
  parts.push(ageLabels[params.ageGroup]);

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

  parts.push('therapeutic storytelling techniques for children, narrative structure, character development');

  return parts.join('. ');
}

// ─── V2: Semantic Search via Supabase pgvector ───────────────

async function querySemanticV2(
  params: RagQuery,
  deps: AgentDependencies
): Promise<RagChunk[]> {
  const { supabase } = await import('../lib/supabase');
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  const maxChunks = params.maxChunks || DEFAULT_MAX_CHUNKS;
  const semanticQuery = buildSemanticQuery(params);

  console.log('📚 RAG V2: Semantic query:', `${semanticQuery.slice(0, 100)}...`);

  const queryEmbedding = await generateQueryEmbedding(semanticQuery, deps);
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

  const filtered = allResults
    .filter((result) => result.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxChunks);

  console.log(`   → ${filtered.length} chunks found (best similarity: ${filtered[0]?.similarity?.toFixed(3) || 'N/A'})`);

  return filtered.map((result) => ({
    id: result.id,
    collection: result.collection,
    tags: result.tags,
    summary: result.summary || '',
    fullContent: result.full_content,
    source: result.source,
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
    pedagogy.behaviorChallenges?.forEach((challenge) => tags.push(`topic:${challenge}`));
    pedagogy.skillsToReinforce?.forEach((skill) => tags.push(`skill:${skill}`));
    pedagogy.emotionalContext?.forEach((emotion) => tags.push(`emotion:${emotion}`));
    pedagogy.valuesToTransmit?.forEach((value) => tags.push(`value:${value}`));
  }

  return tags;
}

// ─── Public API ──────────────────────────────────────────────

export async function queryRag(
  params: RagQuery,
  deps?: AgentDependencies
): Promise<RagChunk[]> {
  if (deps?.isInitialized) {
    try {
      return await querySemanticV2(params, deps);
    } catch (err) {
      console.warn('⚠️ RAG V2 failed, falling back to V1:', (err as Error).message);
    }
  }

  try {
    const { allChunks } = await import('../data/rag');
    const relevantTags = buildTagsFromQuery(params.ageGroup, params.pedagogy);
    const maxChunks = params.maxChunks || DEFAULT_MAX_CHUNKS;

    let filtered = allChunks;

    if (params.collections?.length) {
      filtered = filtered.filter((chunk) => params.collections!.includes(chunk.collection));
    }

    filtered = filtered.filter((chunk) =>
      chunk.tags.some((tag) => relevantTags.includes(tag))
    );

    filtered.sort((a, b) => {
      const aMatches = a.tags.filter((tag) => relevantTags.includes(tag)).length;
      const bMatches = b.tags.filter((tag) => relevantTags.includes(tag)).length;
      return bMatches - aMatches;
    });

    console.log(`📚 RAG V1 fallback: ${filtered.length} chunks found by tags`);
    return filtered.slice(0, maxChunks);
  } catch {
    console.warn('⚠️ RAG V1 fallback also failed. No RAG context available.');
    return [];
  }
}

export function formatChunksForPrompt(chunks: RagChunk[]): string {
  if (chunks.length === 0) return '';

  return chunks
    .map((chunk) => `[${chunk.source}]:\n${chunk.fullContent}`)
    .join('\n\n---\n\n');
}
