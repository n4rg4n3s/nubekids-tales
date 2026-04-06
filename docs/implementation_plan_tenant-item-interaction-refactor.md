# Implementation Plan: Close the `tenant` vs `itemInteractionMode` Refactor

> Fecha: 2026-04-06
> Estado: Plan definitivo para ejecutar en esta sesion
> Objetivo: cerrar de verdad el refactor para que el wizard, el pipeline y el runtime B2B real dejen de depender semanticamente de `shoe-store` / `fashion-store`.

---

## 1. Diagnostico real

El refactor de `itemInteractionMode` ya existe, pero esta solo medio cerrado.

Hoy el sistema esta dividido en dos capas:

- una capa nueva correcta, donde narrativa e imagen ya usan `itemInteractionMode`
- una capa legacy que sigue filtrando semantica vieja en wizard, configs demo y runtime B2B

Los restos principales son:

1. `StepStory.tsx` sigue resolviendo previews por `verticalId`
2. `StepItem.tsx` sigue apoyandose en labels y placeholders heredados de tenants legacy
3. el flujo B2B real sigue validando tenants en Supabase, pero la config de frontend se resuelve con `tenantLoader` local
4. `interactive` existe en tipos y helpers, pero no existe como modo operativo real de demo

Conclusión:

- el pipeline ya fue refactorizado
- el wizard y el runtime aun no

---

## 2. Objetivo final de esta iteracion

Al terminar esta ejecucion, el sistema debe comportarse asi:

- `itemInteractionMode` sera la fuente de verdad narrativa y de UX del objeto
- `verticalId` quedara reducido a metadato legacy/comercial, sin controlar comportamiento
- el wizard sera uno solo en estructura
- el copy del wizard podra variar solo por `itemInteractionMode`
- no quedara rastro estructural de `shoe-store` ni `fashion-store` en el wizard
- el runtime B2B real construira `TenantConfig` desde datos reales del tenant, no desde configs demo locales
- existira una demo real para `interactive`

---

## 3. Principios de diseño que voy a aplicar

### 3.1 Un solo wizard, varias semanticas

La estructura del wizard no se bifurca por tenant.

Solo podra cambiar:

- el copy necesario para `generic`
- el copy necesario para `wearable`
- el copy necesario para `interactive`

No podra cambiar por:

- `shoe-store`
- `fashion-store`
- ids legacy de tenant

### 3.2 `verticalId` deja de mandar

`verticalId` se mantiene por compatibilidad y trazabilidad, pero deja de gobernar:

- previews del wizard
- textos del wizard
- prompts narrativos
- decisiones visuales

### 3.3 Los tenants demo legacy pasan a ser aliases, no modelos

`shoe-store-default` y `fashion-store-default` seguiran siendo validos por compatibilidad, pero ya no representaran dos comportamientos distintos.

Ambos apuntaran al mismo comportamiento `wearable`.

### 3.4 El runtime real no puede depender de demo configs

Si un token B2B real trae un tenant real desde Supabase, la app debe poder construir un `TenantConfig` funcional con esa data real.

No es aceptable seguir haciendo:

- validar tenant real en base de datos
- pero resolver la config narrativa/UI con `tenantLoader` local

---

## 4. Alcance exacto de la ejecucion

### Incluido

- reescribir el plan de cierre del refactor
- hacer `StepStory` independiente de `verticalId`
- hacer `StepItem` dependiente de `itemInteractionMode`, no de labels legacy del tenant
- simplificar y neutralizar las configs demo locales
- convertir `shoe-store-default` y `fashion-store-default` en compatibilidad legacy real
- añadir soporte operativo para `interactive` con tenant demo
- crear un adaptador `DB tenant -> TenantConfig`
- hacer que el flujo B2B real use ese adaptador
- añadir soporte de `item_interaction_mode` en datos reales con compatibilidad hacia atras
- actualizar documentacion principal afectada

### No incluido

- rediseño completo del onboarding B2B
- dashboard de tenant
- migracion completa de todos los tenants a un catalogo administrable desde base de datos
- rediseño profundo del pipeline multiagente

---

## 5. Plan de ejecucion exacto

### Fase A. Reordenar el modelo para que la semantica viva en helpers, no en tenants legacy

Acciones:

- ampliar `src/utils/itemInteraction.ts` para que no solo contenga instrucciones narrativas, sino tambien copy de wizard y fallbacks por modo
- rebajar `verticalId` a metadato flexible/legacy en `src/types.ts`
- dejar de usar en el wizard campos como `itemLabelSingular` y `itemPlaceholderText` como fuente de verdad

Resultado esperado:

- el lenguaje del wizard se resolvera desde `itemInteractionMode`
- los tenants no volveran a arrastrar una UX distinta por categoria historica

### Fase B. Cerrar el wizard

#### B.1 `StepStory`

Acciones:

- eliminar el mapeo de previews por `verticalId`
- usar previews neutrales por genero, comunes para cualquier tenant

Resultado esperado:

- el paso 4 mostrara estilos visuales, no verticales historicos

#### B.2 `StepItem`

Acciones:

- rehacer titulos, subtitulos, labels, placeholders y estados vacios para que dependan de `itemInteractionMode`
- conservar branding comercial (`storeName`, `tenantName`) donde tenga sentido
- evitar cualquier copy estructural basado en “zapatos”, “prenda” o equivalentes legacy

Resultado esperado:

- el paso 3 sera un unico componente con semantica por modo
- `wearable` tendra copy wearable
- `generic` tendra copy generic
- `interactive` tendra copy interactive

### Fase C. Neutralizar configs demo legacy

Acciones:

- crear una config demo canonica para `wearable`
- crear una config demo canonica para `interactive`
- mantener `shoe-store-default` y `fashion-store-default` como aliases compatibles
- dejar `direct-b2c` como modo `generic`
- unificar prompts base demo para que no dependan de zapato/ropa

Resultado esperado:

- las demos legacy seguiran funcionando
- pero el modelo canonico ya no sera `shoe-store` vs `fashion-store`

### Fase D. Corregir el runtime B2B real

Acciones:

- crear un factory/adaptador que construya `TenantConfig` desde datos reales de tenant
- hacer que `tokenService` exponga `itemInteractionMode` real o un fallback inferido
- cambiar `App.tsx` para que, en flujo real `?token=...`, deje de usar `loadTenantConfig(tenantId)`
- reservar `tenantLoader` para demo/local/testing

Resultado esperado:

- un tenant real de base de datos podra renderizar wizard y pipeline sin depender de ids demo locales

### Fase E. Compatibilidad de datos y migracion segura

Acciones:

- añadir migracion SQL para `public.tenants.item_interaction_mode`
- backfill compatible hacia atras:
  - `shoe-store` y `fashion-store` -> `wearable`
  - `direct-b2c` -> `generic`
  - fallback controlado para otros casos legacy
- mantener inferencia defensiva en frontend mientras existan filas antiguas

Resultado esperado:

- el sistema funcionara tanto con datos ya migrados como con tenants legacy no actualizados

### Fase F. Documentacion y validacion

Acciones:

- actualizar `PLANNING.md`
- actualizar `HANDOFF.md`
- actualizar runbooks/docs de demo si siguen mostrando ids legacy como modelo principal
- validar `npm run build`

Resultado esperado:

- la documentacion quedara alineada con el modelo real
- el cierre del refactor quedara verificable

---

## 6. Archivos que voy a tocar

### Modelo y helpers

- `src/types.ts`
- `src/utils/itemInteraction.ts`
- `src/config/tenantLoader.ts`
- `src/config/tenantConfigFactory.ts` o equivalente nuevo

### Configs demo

- `src/config/tenants/shoe-store.config.ts`
- `src/config/tenants/fashion-store.config.ts`
- `src/config/tenants/direct-b2c.config.ts`
- nueva config demo `wearable`
- nueva config demo `interactive`

### Wizard

- `src/components/wizard/StepItem.tsx`
- `src/components/wizard/StepStory.tsx`

### Runtime B2B real

- `src/services/tokenService.ts`
- `src/App.tsx`

### Base de datos / compatibilidad

- nueva migracion en `supabase/migrations/`

### Documentacion

- `PLANNING.md`
- `HANDOFF.md`
- `docs/b2b_tenant_activation_and_token_test_guide.md`
- `docs/nubekids_b2b2c_simulator.html`

---

## 7. Definicion de done de esta sesion

Esta iteracion se considerara cerrada solo si se cumplen todos estos puntos:

1. `StepStory` ya no usa `verticalId`
2. `StepItem` ya no usa copy estructural heredado de `shoe-store` / `fashion-store`
3. el wizard adapta el copy solo por `itemInteractionMode`
4. existe una demo funcional `interactive`
5. `shoe-store-default` y `fashion-store-default` quedan solo como compatibilidad
6. el flujo real `?token=...` construye `TenantConfig` desde datos reales del tenant
7. existe ruta de compatibilidad para tenants antiguos sin `item_interaction_mode`
8. la app compila
9. la documentacion principal queda actualizada

---

## 8. Riesgos y mitigacion

### Riesgo 1. Romper demos legacy

Mitigacion:

- mantener aliases de tenant
- mantener fallback defensivo en `tenantLoader`

### Riesgo 2. Mezclar branding con semantica otra vez

Mitigacion:

- branding solo en `tenantName`, `storeName`, `brandColors`
- semantica del objeto solo en `itemInteractionMode`

### Riesgo 3. Tener tenants reales sin la nueva columna en DB

Mitigacion:

- migracion SQL
- inferencia temporal desde campos legacy

---

## 9. Decision operativa final

No voy a intentar “parchear” un poco el wizard actual.

Voy a cerrar el refactor correctamente con esta regla:

- demo/local -> `tenantLoader`
- runtime real -> adapter desde tenant real
- wizard -> copy por `itemInteractionMode`
- legacy ids -> alias compatibles, nunca modelo canonico

Ese es el plan que se ejecuta en esta sesion.
