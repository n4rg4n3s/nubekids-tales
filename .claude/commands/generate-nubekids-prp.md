# Generate NubeKids PRP

## Feature file: $ARGUMENTS

Genera un PRP completo para implementar una feature en la plataforma NubeKids.
Lee el archivo de requisitos, investiga el contexto necesario, y produce un PRP
con todo el contexto que un agente de IA necesita para implementar en una pasada.

## Proceso de Investigación

1. **Leer Requisitos**
   - Lee el archivo especificado en $ARGUMENTS
   - Identifica qué componentes del dominio están involucrados
   - Determina qué verticales y Age Groups se ven afectados

2. **Contexto del Codebase**
   - Busca implementaciones similares en el código existente
   - Identifica archivos a modificar vs crear
   - Revisa las convenciones existentes (naming, imports, estructura)
   - Comprueba qué tests existen para patrones similares

3. **Contexto del Dominio NubeKids**
   - Revisa CLAUDE.md para las reglas inviolables relevantes
   - Lee la rule on-demand correspondiente (.claude/rules/)
   - Identifica data models afectados en types.ts
   - Verifica impacto en el pipeline multiagente si aplica

4. **Investigación Externa**
   - Busca documentación relevante de Gemini API si toca agentes/RAG
   - Busca patrones de React/Tailwind si toca componentes
   - Documenta gotchas específicos de las librerías usadas

## Generación del PRP

Usando PRPs/templates/prp_nubekids_base.md como template:

### Contexto Crítico a Incluir
- **Vocabulario del dominio** afectado (de CLAUDE.md)
- **Data models** relevantes (interfaces de types.ts)
- **Pipeline multiagente** si la feature toca agentes
- **TenantConfig** si la feature varía por vertical
- **Age Group** si la feature toca contenido generado
- **Design System** si la feature toca UI (paleta, botones, tipografía)

### Blueprint de Implementación
- Tasks ordenadas por dependencia
- Pseudocódigo con detalles críticos
- Archivos a crear/modificar con responsabilidad
- Gotchas específicos de NubeKids

### Validation Gates
```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build

# Tests de dominio específicos para la feature
# (descriptos en el PRP)
```

## Output

Guardar como: `PRPs/{feature-name}.md`

## Checklist de Calidad
- [ ] Vocabulario del dominio NubeKids usado correctamente
- [ ] Reglas inviolables referenciadas donde aplican
- [ ] Data models incluidos con interfaces relevantes
- [ ] Validation gates ejecutables
- [ ] Gotchas de NubeKids documentados
- [ ] Impacto en multitenancy evaluado
- [ ] Impacto en Age Groups evaluado si aplica

Score de confianza: 1-10 para implementación en una pasada.
