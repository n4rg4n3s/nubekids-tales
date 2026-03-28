# 📚 docs/reference/ — Tus Documentos de Consulta

Aquí van los documentos originales del proyecto que usas como referencia.
Estos archivos NO los lee la IA automáticamente — son tu biblioteca personal.
Cuando necesites que la IA los consulte, le dices "lee el archivo docs/reference/nombre.md".

## Qué poner aquí

Copia aquí tus 4 documentos originales:

```
docs/reference/
├── nubekids_PRD_v2.md              ← Product Requirements Document
├── nubekids_PRP_v2.md              ← Product Requirements Prompt (técnico)
├── nubekids_DD_Design_Document.md  ← UI/UX Design Document
└── gemini_embeddings.md            ← Documentación de Gemini Embeddings
```

## Cómo se diferencia de los otros archivos

| Carpeta | Propósito | ¿La IA lo lee automáticamente? |
|---------|-----------|-------------------------------|
| `docs/reference/` | Tus documentos originales de consulta | ❌ No — solo si tú le dices |
| `CLAUDE.md` | Reglas globales del proyecto | ✅ Siempre |
| `.claude/rules/` | Reglas por área (agentes, UI, tenant...) | ✅ Automático según qué archivos toque |
| `PRPs/` | Plantillas para generar features | ❌ Solo cuando ejecutes /generate-nubekids-prp |
| `PRPs/ai_docs/` | Docs técnicos resumidos para la IA | ❌ Solo cuando un PRP lo referencia |

## Regla simple

- **`docs/reference/`** = documentos COMPLETOS originales (para ti y para la IA cuando se los pidas)
- **`CLAUDE.md`** = resumen ejecutivo de reglas (para la IA, siempre cargado)
- **`.claude/rules/`** = reglas específicas por área (para la IA, carga automática)
