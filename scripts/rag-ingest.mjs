/**
 * NubeKids RAG V2 — Ingestion Script
 * 
 * Reads .md files from docs/rag-sources/{collection}/
 * Chunks them (~500 tokens), generates embeddings with gemini-embedding-001,
 * and uploads to Supabase pgvector.
 * 
 * Usage:
 *   node scripts/rag-ingest.mjs
 *   node scripts/rag-ingest.mjs --clean    (wipe existing chunks first)
 *   node scripts/rag-ingest.mjs --dry-run  (preview chunks without uploading)
 * 
 * Requires:
 *   npm install @google/genai @supabase/supabase-js
 *   .env.local with VITE_GEMINI_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// ─── Configuration ───────────────────────────────────────────
const CONFIG = {
    // Paths (relative to project root)
    sourcesDir: 'docs/rag-sources',
    collections: ['child-psych', 'storytelling'],

    // Chunking
    targetChunkSize: 2000,   // ~500 tokens in chars
    maxChunkSize: 2800,      // Hard limit
    minChunkSize: 200,       // Skip tiny fragments
    overlapSize: 200,        // Overlap between chunks

    // Embeddings
    embeddingModel: 'gemini-embedding-001',
    embeddingDimensions: 768,
    embeddingBatchSize: 5,   // Chunks per API call (Gemini limit)
    embeddingDelayMs: 500,   // Delay between batches to avoid rate limits

    // Source metadata — maps filename patterns to clean source citations
    sourceMap: {
        'Bilbao': 'Bilbao, Á. - El cerebro del niño explicado a los padres',
        'Crianza_Respetuosa': 'Crianza Respetuosa (E-Book)',
        'Siegel': 'Siegel, D.J. & Bryson, T.P.',
        'Whole-Brain': 'Siegel, D.J. - The Whole-Brain Child',
        'Yes_Brain': 'Siegel, D.J. - The Yes Brain',
        'No-Drama': 'Siegel, D.J. - No-Drama Discipline Workbook',
        'Mind_in_the_making': 'Galinsky, E. - Mind in the Making',
        'How_To_Talk': 'Faber, A. & Mazlish, E. - How To Talk So Kids Can Learn',
        'Disciplina_sin': 'Siegel, D.J. - Disciplina sin lágrimas',
        'On_Writing': 'King, S. - On Writing: A Memoir of the Craft',
        'Anatomy_of_Story': 'Truby, J. - The Anatomy of Story',
        'Hero_with': 'Campbell, J. - The Hero with a Thousand Faces',
        'Writers_Journey': 'Vogler, C. - The Writer\'s Journey',
        'Wonderbook': 'VanderMeer, J. - Wonderbook',
    },
};

// ─── Load environment ────────────────────────────────────────
function loadEnv() {
    // Read .env.local manually (no dotenv dependency needed)
    const envPath = join(process.cwd(), '.env.local');
    if (!existsSync(envPath)) {
        console.error('❌ .env.local not found. Create it with VITE_GEMINI_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
        process.exit(1);
    }
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
    }
}

loadEnv();

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables. Need: VITE_GEMINI_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

// ─── Initialize clients ──────────────────────────────────────
const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Markdown Cleaning ───────────────────────────────────────
function cleanMarkdown(content) {
    let cleaned = content;

    // Remove image references
    cleaned = cleaned.replace(/!\[image[^\]]*\]\([^)]*\)\n?/g, '');

    // Remove standalone image lines
    cleaned = cleaned.replace(/^\s*!\[.*\]\(.*\)\s*$/gm, '');

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

    // Remove common PDF artifacts
    cleaned = cleaned.replace(/^\s*\d+\s*$/gm, '');  // Standalone page numbers
    cleaned = cleaned.replace(/^\s*[ivxlcdm]+\s*$/gmi, ''); // Roman numeral pages

    return cleaned.trim();
}

// ─── Skip sections (TOC, credits, legal) ─────────────────────
function shouldSkipSection(text) {
    const lower = text.toLowerCase();
    const skipPatterns = [
        /^table of contents/i,
        /^(portada|créditos|colofón)/i,
        /isbn[:\s]/i,
        /all rights reserved/i,
        /quedan rigurosamente prohibid/i,
        /copyright\s*©/i,
        /^dedicatoria$/i,
        /library of congress/i,
        /printed in/i,
    ];
    return skipPatterns.some(p => p.test(lower));
}

// ─── Chunking Engine ─────────────────────────────────────────
function chunkDocument(content, source, collection) {
    const cleaned = cleanMarkdown(content);

    // Split by headers first
    const sections = splitByHeaders(cleaned);

    const chunks = [];
    let globalIndex = 0;

    for (const section of sections) {
        if (shouldSkipSection(section.text)) continue;
        if (section.text.trim().length < CONFIG.minChunkSize) continue;

        // If section fits in one chunk, use it as-is
        if (section.text.length <= CONFIG.targetChunkSize) {
            chunks.push({
                id: `${slugify(source)}-${String(globalIndex).padStart(4, '0')}`,
                collection,
                source,
                section_header: section.header || null,
                full_content: section.text.trim(),
                tags: [],
                token_count: estimateTokens(section.text),
                chunk_index: globalIndex,
            });
            globalIndex++;
        } else {
            // Split large sections by paragraphs
            const subChunks = splitLargeSection(section.text, section.header);
            for (const sub of subChunks) {
                if (sub.trim().length < CONFIG.minChunkSize) continue;
                chunks.push({
                    id: `${slugify(source)}-${String(globalIndex).padStart(4, '0')}`,
                    collection,
                    source,
                    section_header: section.header || null,
                    full_content: sub.trim(),
                    tags: [],
                    token_count: estimateTokens(sub),
                    chunk_index: globalIndex,
                });
                globalIndex++;
            }
        }
    }

    return chunks;
}

function splitByHeaders(text) {
    // Split on markdown headers (# through ######)
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    const sections = [];
    let lastIndex = 0;
    let lastHeader = null;
    let match;

    while ((match = headerRegex.exec(text)) !== null) {
        // Save previous section
        if (lastIndex < match.index) {
            const sectionText = text.slice(lastIndex, match.index);
            if (sectionText.trim()) {
                sections.push({ header: lastHeader, text: sectionText });
            }
        }
        lastHeader = match[2].trim();
        lastIndex = match.index + match[0].length;
    }

    // Save last section
    if (lastIndex < text.length) {
        const remaining = text.slice(lastIndex);
        if (remaining.trim()) {
            sections.push({ header: lastHeader, text: remaining });
        }
    }

    // If no headers found, treat entire text as one section
    if (sections.length === 0 && text.trim()) {
        sections.push({ header: null, text });
    }

    return sections;
}

function splitLargeSection(text, header) {
    const paragraphs = text.split(/\n\n+/);
    const chunks = [];
    let currentChunk = '';

    for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed) continue;

        const potential = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;

        if (potential.length <= CONFIG.targetChunkSize) {
            currentChunk = potential;
        } else {
            // Save current chunk
            if (currentChunk) {
                chunks.push(currentChunk);
            }

            // Handle paragraphs that are themselves too long
            if (trimmed.length > CONFIG.maxChunkSize) {
                const sentences = splitBySentences(trimmed);
                chunks.push(...sentences);
                currentChunk = '';
            } else {
                currentChunk = trimmed;
            }
        }
    }

    // Don't forget the last chunk
    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}

function splitBySentences(text) {
    // Split on sentence boundaries
    const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
    const chunks = [];
    let current = '';

    for (const sentence of sentences) {
        const potential = current + sentence;
        if (potential.length <= CONFIG.targetChunkSize) {
            current = potential;
        } else {
            if (current) chunks.push(current.trim());
            current = sentence;
        }
    }
    if (current) chunks.push(current.trim());

    return chunks;
}

function estimateTokens(text) {
    // Rough: ~4 chars per token for English, ~3.5 for Spanish
    return Math.round(text.length / 3.8);
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60);
}

// ─── Source name extraction ──────────────────────────────────
function extractSource(filename) {
    for (const [pattern, source] of Object.entries(CONFIG.sourceMap)) {
        if (filename.includes(pattern)) return source;
    }
    // Fallback: clean up filename
    return filename
        .replace(/_/g, ' ')
        .replace(/\(.*?\)/g, '')
        .replace(/\.md$/, '')
        .trim()
        .slice(0, 100);
}

// ─── Embedding Generation ────────────────────────────────────
async function generateEmbeddings(chunks) {
    console.log(`\n🧠 Generating embeddings for ${chunks.length} chunks...`);

    const results = [];

    for (let i = 0; i < chunks.length; i += CONFIG.embeddingBatchSize) {
        const batch = chunks.slice(i, i + CONFIG.embeddingBatchSize);
        const batchNum = Math.floor(i / CONFIG.embeddingBatchSize) + 1;
        const totalBatches = Math.ceil(chunks.length / CONFIG.embeddingBatchSize);

        process.stdout.write(`   Batch ${batchNum}/${totalBatches}...`);

        try {
            const response = await genai.models.embedContent({
                model: CONFIG.embeddingModel,
                contents: batch.map(c => c.full_content),
                config: {
                    outputDimensionality: CONFIG.embeddingDimensions,
                    taskType: 'RETRIEVAL_DOCUMENT',
                },
            });

            for (let j = 0; j < batch.length; j++) {
                results.push({
                    ...batch[j],
                    embedding: response.embeddings[j].values,
                });
            }

            console.log(` ✅ (${batch.length} chunks)`);
        } catch (err) {
            console.log(` ❌ Error: ${err.message}`);
            // Add chunks without embeddings — can retry later
            for (const chunk of batch) {
                results.push({ ...chunk, embedding: null });
            }
        }

        // Rate limit delay
        if (i + CONFIG.embeddingBatchSize < chunks.length) {
            await new Promise(r => setTimeout(r, CONFIG.embeddingDelayMs));
        }
    }

    const successCount = results.filter(r => r.embedding).length;
    console.log(`   Done: ${successCount}/${results.length} embeddings generated`);

    return results;
}

// ─── Supabase Upload ─────────────────────────────────────────
async function uploadToSupabase(chunksWithEmbeddings) {
    console.log(`\n📤 Uploading ${chunksWithEmbeddings.length} chunks to Supabase...`);

    let uploaded = 0;
    let errors = 0;

    // Upload in batches of 20 (Supabase upsert limit)
    for (let i = 0; i < chunksWithEmbeddings.length; i += 20) {
        const batch = chunksWithEmbeddings.slice(i, i + 20);

        const rows = batch.map(chunk => ({
            id: chunk.id,
            collection: chunk.collection,
            source: chunk.source,
            section_header: chunk.section_header,
            full_content: chunk.full_content,
            summary: chunk.summary || null,
            tags: chunk.tags,
            embedding: chunk.embedding ? `[${chunk.embedding.join(',')}]` : null,
            token_count: chunk.token_count,
            chunk_index: chunk.chunk_index,
        }));

        const { error } = await supabase
            .from('rag_chunks')
            .upsert(rows, { onConflict: 'id' });

        if (error) {
            console.error(`   ❌ Batch error: ${error.message}`);
            errors += batch.length;
        } else {
            uploaded += batch.length;
        }
    }

    console.log(`   Done: ${uploaded} uploaded, ${errors} errors`);
    return { uploaded, errors };
}

// ─── Clean existing data ─────────────────────────────────────
async function cleanExistingData() {
    console.log('🗑️  Cleaning existing rag_chunks...');
    const { error } = await supabase.from('rag_chunks').delete().neq('id', '');
    if (error) {
        console.error(`   ❌ Error: ${error.message}`);
    } else {
        console.log('   ✅ Cleaned');
    }
}

// ─── Main Pipeline ───────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const isClean = args.includes('--clean');
    const isDryRun = args.includes('--dry-run');

    console.log('═══════════════════════════════════════════');
    console.log('  NubeKids RAG V2 — Ingestion Pipeline');
    console.log('═══════════════════════════════════════════');
    console.log(`  Mode: ${isDryRun ? 'DRY RUN (no upload)' : isClean ? 'CLEAN + INGEST' : 'INGEST (upsert)'}`);
    console.log(`  Source: ${CONFIG.sourcesDir}/`);
    console.log(`  Collections: ${CONFIG.collections.join(', ')}`);
    console.log('');

    if (isClean && !isDryRun) {
        await cleanExistingData();
    }

    // Process each collection
    let allChunks = [];

    for (const collection of CONFIG.collections) {
        const dirPath = join(process.cwd(), CONFIG.sourcesDir, collection);

        if (!existsSync(dirPath)) {
            console.warn(`⚠️  Directory not found: ${dirPath}`);
            continue;
        }

        const files = readdirSync(dirPath).filter(f => f.endsWith('.md'));
        console.log(`\n📂 ${collection}/ — ${files.length} files`);

        for (const file of files) {
            const filePath = join(dirPath, file);
            const content = readFileSync(filePath, 'utf-8');
            const source = extractSource(file);

            // Check if file has actual text (not just images)
            const textOnly = content.replace(/!\[image[^\]]*\]\([^)]*\)/g, '').trim();
            if (textOnly.length < 500) {
                console.log(`   ⏭️  ${file.slice(0, 50)}... — SKIPPED (images only)`);
                continue;
            }

            const chunks = chunkDocument(content, source, collection);
            allChunks.push(...chunks);

            const totalChars = chunks.reduce((sum, c) => sum + c.full_content.length, 0);
            const totalTokens = chunks.reduce((sum, c) => sum + c.token_count, 0);
            console.log(`   ✅ ${source}`);
            console.log(`      → ${chunks.length} chunks, ~${totalTokens} tokens, ${Math.round(totalChars / 1024)}KB`);
        }
    }

    console.log(`\n═══════════════════════════════════════════`);
    console.log(`  Total: ${allChunks.length} chunks from ${CONFIG.collections.length} collections`);
    console.log(`  Tokens: ~${allChunks.reduce((s, c) => s + c.token_count, 0)}`);
    console.log(`═══════════════════════════════════════════`);

    if (isDryRun) {
        console.log('\n📋 DRY RUN — Sample chunks:');
        for (const chunk of allChunks.slice(0, 3)) {
            console.log(`\n--- ${chunk.id} ---`);
            console.log(`Collection: ${chunk.collection}`);
            console.log(`Source: ${chunk.source}`);
            console.log(`Section: ${chunk.section_header || '(none)'}`);
            console.log(`Tokens: ~${chunk.token_count}`);
            console.log(`Content: ${chunk.full_content.slice(0, 200)}...`);
        }
        console.log(`\n... and ${allChunks.length - 3} more chunks`);
        console.log('\nRun without --dry-run to upload to Supabase.');
        return;
    }

    // Generate embeddings
    const chunksWithEmbeddings = await generateEmbeddings(allChunks);

    // Upload to Supabase
    const result = await uploadToSupabase(chunksWithEmbeddings);

    console.log(`\n🎉 Ingestion complete!`);
    console.log(`   ${result.uploaded} chunks in Supabase with embeddings`);
    console.log(`   Ready for semantic search in ragService.ts`);
}

main().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
