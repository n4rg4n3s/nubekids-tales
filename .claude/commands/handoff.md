# Handoff — Capturar Estado de Sesión para Continuación

## Objetivo

Crear un documento de handoff estructurado que capture todo lo que la próxima sesión
(o agente/modelo) necesita para continuar el trabajo sin fricción.

Esto es especialmente importante en NubeKids porque se usan diferentes modelos/herramientas
y la continuidad del contexto de dominio es crítica.

## Proceso

### 1. Analizar la Sesión Actual

- ¿Cuál era la tarea original?
- ¿Qué se completó?
- ¿Qué está en progreso o bloqueado?
- ¿Qué decisiones de arquitectura se tomaron y POR QUÉ?
- ¿Qué archivos se crearon/modificaron?
- ¿Qué callejones sin salida se exploraron (para no repetirlos)?

### 2. Recopilar Estado

```bash
git status
git diff --stat HEAD
git log --oneline -5
git branch --show-current
```

### 3. Escribir HANDOFF.md

```markdown
# Handoff: [Descripción Breve de la Tarea]

**Fecha:** [fecha actual]
**Branch:** [branch actual]
**Último Commit:** [hash + mensaje]
**Modelo/Herramienta usada:** [Claude Code / Cursor / Antigravity / otro]

## Contexto de Dominio NubeKids
[Qué verticales, Age Groups, o agentes están involucrados en esta tarea]

## Completado
- [x] [Tarea 1 — qué se hizo]
- [x] [Tarea 2 — qué se hizo]

## Siguiente Paso / En Progreso
- [ ] [Tarea 3 — qué hay que hacer, con paths de archivos específicos]
- [ ] [Tarea 4 — bloqueadores si los hay]

## Decisiones Clave
- **[Decisión]**: [Qué se eligió] — [Por qué, incluyendo alternativas descartadas]

## Callejones Sin Salida (NO repetir)
- [Enfoque que se probó y no funcionó] — [Por qué falló]

## Archivos Modificados
- `path/to/file.ts` — [qué cambió y por qué]

## Estado de Validación
- **Lint:** PASS/FAIL
- **TypeScript:** PASS/FAIL
- **Tests:** PASS/FAIL
- **Build:** PASS/FAIL
- **Domain checks:** [hardcoded strings, Age Group validation, etc.]

## Para la Próxima Sesión
[2-4 frases: lo MÁS IMPORTANTE que el siguiente agente necesita saber]

**Acción recomendada:** [Comando o paso exacto para empezar]
**Leer primero:** CLAUDE.md + [rule relevante de .claude/rules/]
```

### 4. Confirmar

Tras escribir el handoff:
1. Confirmar que se escribió con su ruta completa
2. Sugerir: "Lee HANDOFF.md y CLAUDE.md antes de continuar"
3. Si hay cambios sin commit, sugerir commit primero
