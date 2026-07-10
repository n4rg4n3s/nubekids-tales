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
import {
  resolveAnchorPhrase,
  resolveFocus,
  resolveReinforcementPhrase,
} from '../config/pedagogyCatalog';

// ─── Configuration ───────────────────────────────────────────

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;
const SIMILARITY_THRESHOLD = 0.3;
const BASE_MAX_CHUNKS_BY_AGE: Record<AgeGroup, number> = {
  baby: 4,
  tiny: 5,
  little: 6,
  reader: 7,
};
const PEDAGOGY_BONUS_CHUNKS = 1;
const COMPLEX_PEDAGOGY_BONUS_CHUNKS = 1;
const COMPLEX_PEDAGOGY_SIGNAL_THRESHOLD = 3;
const MAX_ADAPTIVE_CHUNKS = 9;

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

export function buildSemanticQuery(params: RagQuery): string {
  const parts: string[] = [];

  const ageLabels: Record<AgeGroup, string> = {
    baby: 'board books for 0-3 year olds, sensory language, minimal text, read aloud rhythm, repetition',
    tiny: 'picture books for 3-4 year olds, repetition, rhythm, short sentences, pre-reader support',
    little: 'picture books for 4-5 year olds, cause and effect, emotional development, simple narrative arc',
    reader: 'easy readers for 5-7 year olds, emerging reader vocabulary, inference, full narrative arc',
  };
  parts.push(ageLabels[params.ageGroup]);

  if (params.pedagogy?.enabled) {
    const focus = resolveFocus(params.pedagogy.focus);
    const anchorPhrase = resolveAnchorPhrase(params.pedagogy.anchor);
    const reinforcement = resolveReinforcementPhrase(params.pedagogy.reinforcementValue);

    if (focus) {
      const nuance = focus.nuance ? ` — ${focus.nuance}` : '';
      parts.push(`primary developmental focus (${focus.promptLabel}): ${focus.phrase}${nuance}`);
    }
    if (reinforcement) {
      parts.push(`supporting value: ${reinforcement}`);
    }
    if (anchorPhrase) {
      parts.push(`child interests and story world: ${anchorPhrase}`);
    }
    if (params.pedagogy.freeformContext?.trim()) {
      parts.push(`session context: ${params.pedagogy.freeformContext.trim()}`);
    }
  }

  parts.push('therapeutic storytelling techniques for children, narrative structure, character development');

  return parts.join('. ');
}

export function resolveMaxChunks(params: RagQuery): number {
  if (typeof params.maxChunks === 'number' && Number.isFinite(params.maxChunks) && params.maxChunks > 0) {
    return Math.floor(params.maxChunks);
  }

  let maxChunks = BASE_MAX_CHUNKS_BY_AGE[params.ageGroup];
  const pedagogySignalCount = countPedagogySignals(params.pedagogy);

  if (pedagogySignalCount > 0) {
    maxChunks += PEDAGOGY_BONUS_CHUNKS;
  }

  if (pedagogySignalCount >= COMPLEX_PEDAGOGY_SIGNAL_THRESHOLD) {
    maxChunks += COMPLEX_PEDAGOGY_BONUS_CHUNKS;
  }

  return Math.min(maxChunks, MAX_ADAPTIVE_CHUNKS);
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

  const maxChunks = resolveMaxChunks(params);
  const semanticQuery = buildSemanticQuery(params);
  const pedagogySignalCount = countPedagogySignals(params.pedagogy);

  console.log(
    `📚 RAG V2: maxChunks=${maxChunks}, pedagogySignals=${pedagogySignalCount}, query: ${semanticQuery.slice(0, 100)}...`
  );

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

const FOCUS_CATEGORY_TAG_PREFIX: Record<string, string> = {
  'emotion-behavior': 'topic',
  'life-situation': 'emotion',
  skill: 'skill',
  value: 'value',
};

function buildTagsFromQuery(
  ageGroup: AgeGroup,
  pedagogy?: PedagogyProfile
): string[] {
  const tags: string[] = [];
  tags.push(`age:${ageGroup}`);
  tags.push('age:all');

  if (pedagogy?.enabled) {
    const focus = pedagogy.focus;
    if (focus?.id && focus.id !== 'custom') {
      const prefix = FOCUS_CATEGORY_TAG_PREFIX[focus.category] ?? 'topic';
      tags.push(`${prefix}:${focus.id}`);
    }
    if (pedagogy.reinforcementValue) {
      tags.push(`value:${pedagogy.reinforcementValue}`);
    }
    if (pedagogy.anchor?.id && pedagogy.anchor.id !== 'custom') {
      tags.push(`interest:${pedagogy.anchor.id}`);
    }
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
    const maxChunks = resolveMaxChunks(params);

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

function countPedagogySignals(pedagogy?: PedagogyProfile): number {
  if (!pedagogy?.enabled) {
    return 0;
  }

  // Modelo Ancla + Foco: máx. 4 señales (foco, ancla, valor, contexto libre)
  const signals = [
    Boolean(resolveFocus(pedagogy.focus)),
    Boolean(resolveAnchorPhrase(pedagogy.anchor)),
    Boolean(resolveReinforcementPhrase(pedagogy.reinforcementValue)),
    Boolean(pedagogy.freeformContext?.trim()),
  ];

  return signals.filter(Boolean).length;
}
