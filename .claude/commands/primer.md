# Prime Context — NubeKids Platform

Orienta al agente de IA con el contexto completo del proyecto NubeKids antes de empezar cualquier tarea.

## Proceso

### 1. Leer Reglas Globales
Lee `CLAUDE.md` completo. Es el documento más importante. Contiene:
- Vocabulario del dominio (Tenant, Vertical, Item Mágico, Age Group, Beat, AgentBrief...)
- Arquitectura y stack tecnológico
- Reglas inviolables (contenido infantil, pipeline secuencial, multitenancy)
- Convenciones de código
- Anti-patterns explícitos

### 2. Entender la Estructura del Proyecto
```bash
ls src/
ls src/config/tenants/
ls src/services/agents/
ls src/components/
```

### 3. Entender los Data Models
Lee `src/types.ts` — contiene:
- TenantConfig (configuración de tenant/vertical)
- AgeGroup y AgeGroupConfig (calibración por edad)
- PedagogyProfile (personalización pedagógica)
- AgentBrief (output del pipeline multiagente)
- Beat (unidad narrativa = 1 página)
- ComicFace (estado de página del libro)
- Persona (héroe/co-protagonista con imágenes)

### 4. Entender el Pipeline Multiagente
Lee `src/services/agents/orchestratorAgent.ts` — orquestador del pipeline:
- RAG → Narrative → Storytelling → Visual Brief (SECUENCIAL)
- Output: AgentBrief que guía toda la generación de páginas

### 5. Entender la Multitenancy
Lee `src/config/tenantLoader.ts` — cómo se carga la config del tenant:
- Query param `?tenant=` determina la vertical
- Query param `?item=` inyecta el item mágico desde checkout
- Config define labels, colores, genres, languages, pedagogy enabled

### 6. Check Estado Actual
```bash
git status
git log --oneline -5
```

## Output

Resume (en menos de 300 palabras):

### Identidad del Proyecto
- NubeKids: SaaS multitenant B2B de cuentos infantiles con IA
- Stack: React + TypeScript + Vite + Tailwind + Gemini API

### Arquitectura Clave
- Pipeline multiagente: Orchestrator → Narrative → Storytelling → Visual Brief
- RAG V1: chunks .ts filtrados por tags (sin vector DB)
- Multitenancy: config por vertical (shoe-store, fashion-store, direct-b2c)
- Age Groups: tiny (3-4), little (5-6), reader (7-10)

### Reglas Inviolables
- Contenido 100% positivo
- Pipeline secuencial (nunca Promise.all)
- tenantConfig.itemLabel (nunca "zapatos" hardcodeado)
- Age Group obligatorio
- Guardrails no anulables por prompt de tenant

### Estado Actual
- Branch, últimos commits, trabajo pendiente
