# PR — preview/fase11-launch-readiness -> main

## Título sugerido

`feat: finalize preview launch readiness and mobile reading polish`

## Resumen

Esta PR consolida el hardening realizado sobre la rama `preview/fase11-launch-readiness` antes de plantear merge a `main`.

Incluye:

- cierre del refactor `itemInteractionMode` en wizard y runtime B2B real
- limpieza de performance y bundle warnings
- saneamiento GitHub/Vercel tras migración del repo
- validación preview de flujos B2C, B2B token y B2B2C
- mejora de `Book` en móvil con aviso `Gira el móvil` y modo de lectura inmersivo en horizontal
- mejora de export PDF móvil usando `Blob` + flujos `Guardar o compartir` / `Abrir PDF` / `Descargar archivo`
- actualización de documentación operativa (`HANDOFF`, `PLANNING`, preview plan)

## Cambios principales

### Modelo y runtime

- `itemInteractionMode` pasa a ser la fuente de verdad semántica
- `verticalId` queda relegado a metadato legacy
- el flujo B2B real por `?token=` construye `tenantConfig` desde datos reales del tenant

### UX / frontend

- `StepItem` y `StepStory` dejan de arrastrar semántica `shoe-store` / `fashion-store`
- `Book` móvil:
  - en `portrait` muestra aviso `Gira el móvil`
  - en `landscape` usa lectura inmersiva sin barra inferior pesada
  - mantiene ayudas ligeras para paso de página táctil

### PDF móvil

- `pdfExport.ts` ya no decide el guardado con `pdf.save()`
- `Book.tsx` recibe `Blob + fileName` y decide el flujo correcto
- se añade modal móvil con:
  - `Guardar o compartir`
  - `Abrir PDF`
  - `Descargar archivo`

### Docs / operativa

- `HANDOFF.md`
- `PLANNING.md`
- `docs/preview_launch_validation_plan.md`

## Validación realizada

- `npm run lint` OK
- `npm run build` OK
- preview Vercel validada para flujos B2C, B2B real y B2B2C

## Validación pendiente antes de merge

- revalidación manual en iPhone real del nuevo flujo de lectura móvil
- revalidación manual en iPhone real del flujo PDF móvil
- cierre de dominio / legales / cutover final según Fase 11

## Notas de revisión

- La emulación de dispositivos en desktop no es suficiente para validar `Book` móvil, porque la detección usa `pointer: coarse` además del viewport.
- Dos generaciones distintas en dispositivos/sesiones distintas no implican necesariamente bug: el pipeline Gemini actual no es determinista y usa `temperature`.
