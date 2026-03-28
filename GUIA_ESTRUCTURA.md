# NubeKids Tales — Guía de Estructura del Proyecto

## 📁 Mapa Completo de Carpetas

```
nubekids-tales-main/
│
│── 🧠 CONTEXTO PARA LA IA (no es código — son instrucciones)
│   ├── CLAUDE.md                          ← CEREBRO: reglas globales, vocabulario, arquitectura
│   ├── PLANNING.md                        ← Decisiones de arquitectura y roadmap
│   ├── TASK.md                            ← Lista de tareas viva
│   ├── README.md                          ← Guía del sistema de context engineering
│   │
│   ├── .claude/                           ← ⚠️ CARPETA OCULTA en Windows (activar "ver ocultos")
│   │   ├── commands/                      ← Slash commands (/primer, /generate-nubekids-prp...)
│   │   ├── rules/                         ← Reglas por área (se activan automáticamente)
│   │   ├── agents/                        ← Subagentes especializados
│   │   └── settings.local.json            ← Permisos de Claude Code
│   │
│   └── PRPs/                              ← Sistema de Product Requirements Prompts
│       ├── INITIAL.md                     ← Tu primera feature (Fase 1 lista para usar)
│       ├── templates/                     ← Template base para generar PRPs
│       └── ai_docs/                       ← Docs técnicos resumidos para la IA
│
│── 📚 TUS DOCUMENTOS DE CONSULTA
│   └── docs/
│       └── reference/                     ← ⬅️ PON AQUÍ tus 4 documentos (PRD, PRP, DD, embeddings)
│           └── LEEME.md                   ← Instrucciones de qué poner aquí
│
│── 💻 CÓDIGO FUENTE (aún vacío — se llenará al implementar)
│   └── src/
│       ├── config/tenants/                ← Configs de vertical (shoe-store, fashion-store...)
│       ├── components/                    ← React components (Setup, Book, Panel, PedagogyForm...)
│       ├── hooks/                         ← Custom hooks (useTenantConfig, usePedagogyForm...)
│       ├── services/agents/               ← Agentes IA (narrative, storytelling, visual brief...)
│       ├── data/rag/                      ← Chunks RAG tipados (.ts)
│       └── utils/                         ← Utilidades (pdfExport, imageUtils...)
│
│── 🌐 ARCHIVOS PÚBLICOS
│   └── public/                            ← Assets estáticos (favicon, logos...)
│
│── ⚙️ CONFIGURACIÓN DEL PROYECTO (se crearán al inicializar)
│   ├── package.json                       ← (aún no existe — se crea con npm init)
│   ├── tsconfig.json                      ← (aún no existe — se crea con el setup)
│   ├── vite.config.ts                     ← (aún no existe)
│   ├── tailwind.config.js                 ← (aún no existe)
│   └── index.html                         ← (aún no existe)
```

## 🎯 Qué Hacer Ahora (Paso a Paso)

### Paso 1: Pon tus documentos en docs/reference/
Copia estos 4 archivos a `docs/reference/`:
- `nubekids_PRD_v2.md`
- `nubekids_PRP_v2.md`
- `nubekids_DD_Design_Document.md`
- `gemini_embeddings.md`

### Paso 2: Verifica que ves la carpeta .claude
En Windows, abre la carpeta `nubekids-tales-main` en el Explorador de archivos.
Ve a **Ver** → activa **"Elementos ocultos"**.
Deberías ver la carpeta `.claude`.

### Paso 3: Abre el proyecto en tu editor
Abre la carpeta `nubekids-tales-main` en tu editor (VSCode, Antigravity, etc.).
Al abrir una nueva sesión con IA, dile:
> "Lee CLAUDE.md para entender el proyecto"

### Paso 4: Cuando estés listo para empezar a codificar
Con Claude Code:
```
/primer                                    # Orientar al LLM
/generate-nubekids-prp PRPs/INITIAL.md     # Generar PRP para Fase 1
```

Con otro editor/modelo:
> "Lee CLAUDE.md y PLANNING.md. La primera tarea está en PRPs/INITIAL.md"
