# Execute NubeKids PRP

Implementa una feature usando el archivo PRP especificado.

## PRP File: $ARGUMENTS

## Proceso de Ejecución

1. **Cargar PRP**
   - Lee el PRP completo
   - Comprende TODOS los requisitos, contexto y gotchas
   - Lee CLAUDE.md para las reglas inviolables del proyecto
   - Lee la rule on-demand correspondiente si el PRP la referencia
   - Extiende la investigación si necesitas más contexto

2. **ULTRATHINK — Planificación**
   - Piensa profundamente antes de escribir código
   - Crea un plan completo que aborde todos los requisitos
   - Desglosa en pasos pequeños y manejables
   - Identifica el orden correcto de implementación
   - Verifica que el plan respeta las reglas inviolables de NubeKids:
     - ¿Usa `tenantConfig.itemLabel` en lugar de hardcodear?
     - ¿Age Group es obligatorio donde corresponde?
     - ¿Pipeline multiagente es secuencial?
     - ¿Guardrails de contenido infantil están protegidas?

3. **Implementar**
   - Ejecuta el plan paso a paso
   - Implementa todo el código
   - Sigue las convenciones de CLAUDE.md (TypeScript strict, naming, etc.)
   - Respeta el Design System (colores, tipografía, botones táctiles)

4. **Validar — NubeKids Domain Gates**
   ```bash
   # Validación estática
   npm run lint
   npx tsc --noEmit
   
   # Tests
   npm run test
   
   # Build
   npm run build
   
   # Validación de dominio
   grep -r "zapatos\|shoes\|sneakers" src/ --include="*.tsx" --include="*.ts" | grep -v "config\|chunk"
   # Expected: 0 resultados fuera de configs
   ```

5. **Verificación de Dominio**
   - ¿Los labels son dinámicos (tenantConfig.itemLabel)?
   - ¿Los colores usan CSS variables de marca?
   - ¿El pipeline multiagente es secuencial?
   - ¿JSON parsing tiene strip markdown + try/catch?
   - ¿Guardrails están DESPUÉS del prompt del tenant?
   - ¿Age Group está validado como obligatorio?

6. **Completar**
   - Verifica todos los items del checklist del PRP
   - Ejecuta la suite de validación final
   - Reporta estado de completación
   - Relee el PRP para verificar que implementaste todo

Nota: Si la validación falla, usa los patrones de error del PRP para corregir y reintentar.
