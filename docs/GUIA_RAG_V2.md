# RAG V2 — Guía de Implementación Paso a Paso

## Resumen
Este documento te guía para migrar de RAG V1 (filtrado por tags) a RAG V2 
(búsqueda semántica con pgvector). Al final tendrás ~1.2M tokens de conocimiento
experto buscable semánticamente.

---

## PASO 1: Configurar Supabase (5 min)

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto `eyirhuxpqaneiehnmguq`
3. Ve a **SQL Editor** (icono de terminal en el menú lateral)
4. Copia y pega TODO el contenido de `01-supabase-schema.sql`
5. Haz clic en **Run**
6. Deberías ver: "Success. No rows returned"

**Verificación**: Ve a **Table Editor** y confirma que existe la tabla `rag_chunks`.

---

## PASO 2: Asegurar variable de entorno (1 min)

En tu `.env.local` ya deberías tener estas variables. Verifica:

```env
# Ya deberían existir
VITE_SUPABASE_URL=https://eyirhuxpqaneiehnmguq.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aquí

# La API key de Gemini (la misma que usas para generar texto e imágenes)
VITE_GEMINI_API_KEY=tu-gemini-api-key-aquí
```

> Si tu API key de Gemini se llama diferente (ej: `VITE_GOOGLE_API_KEY`), 
> edita la línea 71 de `rag-ingest.mjs` para que coincida.

---

## PASO 3: Copiar el script de ingesta (2 min)

En PowerShell:

```powershell
cd D:\nubekids-tales

# Crear directorio para scripts
mkdir -p scripts

# Copia el archivo rag-ingest.mjs a D:\nubekids-tales\scripts\
# (lo pego abajo o lo puedes descargar del output de Claude)
```

Coloca el archivo `rag-ingest.mjs` en `D:\nubekids-tales\scripts\`.

---

## PASO 4: Instalar dependencia de Supabase (1 min)

```powershell
cd D:\nubekids-tales
npm install @supabase/supabase-js
```

> `@google/genai` ya debería estar instalado. Si no: `npm install @google/genai`

---

## PASO 5: Dry Run — Verificar chunking (2 min)

```powershell
cd D:\nubekids-tales
node scripts/rag-ingest.mjs --dry-run
```

Esto NO sube nada. Solo te muestra:
- Cuántos archivos encuentra por colección
- Cuáles son imagen-only (los skipea)
- Cuántos chunks genera por libro
- Muestra 3 chunks de ejemplo

**Qué esperar:**
```
📂 child-psych/ — 9 files
   ⏭️  Disciplina sin lágrimas... — SKIPPED (images only)
   ✅ Bilbao, Á. - El cerebro del niño explicado a los padres
      → 85 chunks, ~93000 tokens, 354KB
   ...

📂 storytelling/ — 5 files
   ✅ King, S. - On Writing: A Memoir of the Craft
      → 120 chunks, ~115000 tokens, 437KB
   ...

Total: ~600 chunks from 2 collections
```

---

## PASO 6: Ingesta real (10-15 min)

```powershell
node scripts/rag-ingest.mjs --clean
```

`--clean` borra chunks anteriores antes de subir (recomendado la primera vez).
Sin `--clean`, hace upsert (útil para añadir libros nuevos sin borrar los existentes).

**Tiempo estimado:** ~10-15 minutos. La mayor parte es generar embeddings 
(~600 chunks ÷ 5 por batch × 0.5s delay = ~60 batches × 0.5s = ~30s de API 
más overhead de upload).

---

## PASO 7: Verificar en Supabase (1 min)

1. Ve a **Table Editor** > `rag_chunks`
2. Deberías ver filas con:
   - `collection`: "child-psych" o "storytelling"
   - `source`: nombre del autor y libro
   - `full_content`: texto real del chunk
   - `embedding`: vector de 768 dimensiones (se muestra como array largo)

---

## PASO 8: Actualizar ragService.ts (2 min)

Reemplaza el archivo:
```
D:\nubekids-tales\src\services\ragService.ts
```

Con el nuevo `ragService.ts` proporcionado. Este:
- Usa búsqueda semántica si Supabase está disponible
- Cae a V1 (tags) si Supabase falla
- Es compatible con `formatChunksForPrompt()` existente
- No rompe nada del pipeline de agentes

---

## PASO 9: Pasar API key al orchestrator (1 min)

El `ragService.ts` nuevo necesita la API key de Gemini para generar 
embeddings de la query. Verifica que el `orchestratorAgent.ts` pase 
la API key cuando llama a `queryRag()`:

```typescript
// En orchestratorAgent.ts, donde se llama a queryRag:
deps.ragChunks = await queryRag({
  ageGroup: session.ageGroup,
  pedagogy: session.pedagogyProfile,
  collections: session.tenantConfig.ragCollections,
  maxChunks: 5
}, apiKey);  // ← Pasar la API key como segundo argumento
```

---

## PASO 10: Probar end-to-end

```powershell
cd D:\nubekids-tales
npm run dev
# Navegar a http://localhost:5173/
# Crear un cuento con VITE_USE_MOCK=false
# Verificar en consola que aparece "RAG V2: Semantic query..."
```

---

## Añadir más libros en el futuro

1. Convierte el PDF a markdown con OpenDataLoader
2. Copia el `.md` a `docs/rag-sources/child-psych/` o `docs/rag-sources/storytelling/`
3. (Opcional) Añade el patrón del nombre al `sourceMap` en `rag-ingest.mjs`
4. Ejecuta: `node scripts/rag-ingest.mjs` (sin --clean, hace upsert)
5. Listo — los nuevos chunks están disponibles inmediatamente

---

## Troubleshooting

**"Missing environment variables"**
→ Verifica que `.env.local` tiene las 3 variables y reinicia el terminal.

**"Error: Supabase RPC match_rag_chunks not found"**
→ No ejecutaste el SQL del Paso 1. Ve al SQL Editor y ejecútalo.

**"Embedding generation failed"**
→ La API key de Gemini no tiene billing activo o alcanzaste el rate limit. 
  Espera 1 minuto y reintenta.

**Chunks con embedding null**
→ Rerun `node scripts/rag-ingest.mjs` (sin --clean). El upsert regenera 
  los que fallaron.

**"SKIPPED (images only)" para un libro**
→ El PDF era escaneado. Reconviértelo con OpenDataLoader modo híbrido (OCR).