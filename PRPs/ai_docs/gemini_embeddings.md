# Gemini Embeddings — Referencia para RAG V2 de NubeKids

> Este documento es referencia para la migración de RAG V1 (filtrado por tags) a RAG V2 (embeddings semánticos).
> NO implementar en MVP. Solo consultar cuando se planifique la migración.

## Modelos Disponibles

| Modelo | Input | Output | Tokens | Notas |
|--------|-------|--------|--------|-------|
| `gemini-embedding-001` | Solo texto | 3072 dims (default) | 2,048 | Estable, recomendado para V2 |
| `gemini-embedding-2-preview` | Multimodal (texto, imagen, audio, video, PDF) | 3072 dims (default) | 8,192 | Preview, útil si queremos embeddings de ilustraciones |

## Configuración Recomendada para NubeKids RAG V2

```typescript
// Para indexar chunks RAG de neuroeducación, psicología y storytelling
const embeddingConfig = {
  model: 'gemini-embedding-001',
  taskType: 'RETRIEVAL_DOCUMENT',      // Para indexar chunks
  outputDimensionality: 768,            // Balance calidad/coste (MTEB: 67.99 vs 68.17 de 1536)
};

// Para queries del usuario/sistema
const queryConfig = {
  model: 'gemini-embedding-001',
  taskType: 'RETRIEVAL_QUERY',          // Para queries de búsqueda
  outputDimensionality: 768,
};
```

## Task Types Relevantes

| Task Type | Uso en NubeKids |
|-----------|-----------------|
| `RETRIEVAL_DOCUMENT` | Indexar chunks RAG (neuro-dev, child-psych, storytelling) |
| `RETRIEVAL_QUERY` | Buscar chunks relevantes dado un perfil de sesión |
| `SEMANTIC_SIMILARITY` | Comparar coherencia entre beats y arco narrativo |
| `CLASSIFICATION` | Clasificar feedback de usuarios por tema |

## Normalización (IMPORTANTE para dim < 3072)

```typescript
// Si output_dimensionality < 3072, NORMALIZAR embeddings
function normalizeEmbedding(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  return values.map(v => v / norm);
}
```

## Generación de Embeddings (JavaScript)

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Indexar un chunk RAG
const response = await ai.models.embedContent({
  model: 'gemini-embedding-001',
  contents: chunk.fullContent,
  config: { 
    taskType: 'RETRIEVAL_DOCUMENT',
    outputDimensionality: 768 
  },
});

const embedding = response.embeddings[0].values; // number[768]
```

## Migración V1 → V2

```
V1 (MVP):
  Chunks .ts → filtrado por tags → inyección en system prompt
  
V2 (Post-MVP):
  Chunks .ts → gemini-embedding-001 → pgvector/Pinecone
  Query: (ageGroup + pedagogyProfile) → gemini-embedding-001 → vector search → top 5 chunks

Pasos de migración:
1. Generar embeddings para todos los chunks existentes
2. Almacenar en Supabase pgvector o Pinecone
3. Reemplazar ragService.query() para usar vector search
4. Mantener fallback a filtrado por tags si vector search falla
```

## Espacios de Embeddings INCOMPATIBLES

Los embeddings de `gemini-embedding-001` y `gemini-embedding-2-preview` NO son comparables.
Si migras de modelo, debes re-embeber TODOS los datos.
