# Implementation Plan: Tenant vs Item Interaction Mode Refactor

> Fecha: 2026-04-04
> Estado: Draft listo para ejecutar en fork
> Objetivo: desacoplar el concepto de `tenant` del concepto narrativo/visual de cómo el niño se relaciona con el producto.

---

## 1. Problema que resuelve

Ahora mismo el proyecto mezcla dos ideas distintas dentro de la configuración de tenant:

- `tenant` como identidad comercial o branding de la tienda
- `tenant` como pista narrativa para el modelo de cuento e imagen

Eso ha llevado a que existan configuraciones como:

- `shoe-store-default`
- `fashion-store-default`

cuando en realidad esa diferencia no es tanto "qué tipo de tienda es", sino "cómo se usa el objeto en la historia".

Ejemplo:

- un zapato se lleva puesto
- un vestido se lleva puesto
- una gorra se lleva puesta
- un juguete no se lleva puesto, se manipula o se usa para jugar

La taxonomía actual escala mal y fuerza a crear tenants "falsos" para resolver diferencias narrativas.

---

## 2. Objetivo de la refactorización

Separar claramente:

- `tenant`: quién es la tienda / marca / e-Commerce
- `itemInteractionMode`: cómo interactúa el niño con el producto dentro del cuento e imágenes

Primera propuesta de modos:

- `generic`
- `wearable`
- `interactive`

Más adelante se podrán añadir otros sin tocar la arquitectura principal.

---

## 3. Resultado esperado

Al terminar la refactorización:

- el onboarding B2B no dependerá del tipo de producto
- los tenants dejarán de representar categorías narrativas
- el prompt del modelo recibirá una señal más útil y explícita
- zapatos y ropa compartirán el mismo comportamiento narrativo base: `wearable`
- juguetes podrán tener comportamiento propio con `interactive`

---

## 4. Principio de diseño

El criterio base será:

- la identidad comercial vive en `tenant`
- la semántica narrativa/visual vive en `itemInteractionMode`

Esto evita acoplar branding, pricing, onboarding y comportamiento del modelo en un solo eje.

---

## 5. Alcance de esta primera iteración

Incluido:

- añadir `itemInteractionMode` al modelo de configuración
- redefinir el uso de `verticalId` para que no cargue semántica narrativa innecesaria
- unificar `shoe-store` y `fashion-store` alrededor de `wearable`
- preparar la base para introducir `interactive`
- mantener compatibilidad con URLs y tenants actuales

No incluido:

- rediseño del onboarding B2B
- migración completa a tenants reales almacenados en base de datos
- creación de un catálogo multi-vertical completo
- reescritura profunda de prompts multiagente

---

## 6. Decisiones de modelado propuestas

### 6.1 Nuevo tipo

En `src/types.ts`:

```ts
export type ItemInteractionMode = 'generic' | 'wearable' | 'interactive';
```

### 6.2 Extensión de `TenantConfig`

Añadir:

```ts
itemInteractionMode: ItemInteractionMode;
```

### 6.3 Rol de `verticalId`

Opciones:

1. Mantener `verticalId` solo como metadato comercial o de branding.
2. Reducir su relevancia y dejar que el comportamiento real lo controle `itemInteractionMode`.

Recomendación:

- mantener `verticalId` por ahora para no forzar una ruptura mayor
- mover toda la lógica narrativa/visual relevante a `itemInteractionMode`

---

## 7. Estrategia de transición

La transición debe ser incremental y compatible hacia atrás.

### Fase 1. Introducir la nueva capa sin romper nada

- Añadir `ItemInteractionMode` en `src/types.ts`
- Añadir `itemInteractionMode` a todas las configs de tenant
- Asignar:
  - `shoe-store-default` → `wearable`
  - `fashion-store-default` → `wearable`
  - `direct-b2c` → `generic`

Resultado:

- el sistema sigue funcionando igual
- el nuevo dato ya existe

### Fase 2. Desacoplar prompts y labels del tipo de tenant

Revisar dónde se usa información de tenant para construir contexto narrativo:

- prompts base del tenant
- labels de Step 3
- generación de imágenes
- cualquier lógica que asuma implícitamente `shoe-store` o `fashion-store`

Objetivo:

- cambiar la lógica a `itemInteractionMode`

Ejemplo:

- `wearable` → lenguaje tipo "lleva puesto", "viste", "calza", según copy final elegido
- `generic` → lenguaje tipo "acompaña", "lleva consigo", "aparece junto al protagonista"
- `interactive` → lenguaje tipo "usa", "juega con", "interactúa con"

### Fase 3. Consolidar tenants demo

Decidir si:

- se mantienen ambos tenants demo por branding distinto
- o se simplifican los tenants demo a uno solo B2B wearable

Recomendación inicial:

- mantener ambos por ahora si ayudan en demos o branding
- pero dejar claro que ambos comparten `itemInteractionMode: 'wearable'`

### Fase 4. Añadir un tenant demo de juguetes si realmente se necesita

Solo si hay caso de uso real:

- crear una config nueva de demo para `interactive`
- no antes

Esto evita añadir complejidad especulativa.

---

## 8. Archivos previsiblemente afectados

### Tipos y configuración

- `src/types.ts`
- `src/config/tenantLoader.ts`
- `src/config/tenants/shoe-store.config.ts`
- `src/config/tenants/fashion-store.config.ts`
- `src/config/tenants/direct-b2c.config.ts`

### Wizard y experiencia del objeto mágico

- `src/components/Setup.tsx`
- `src/components/wizard/StepItem.tsx`

### Pipeline narrativo / imagen

- `src/services/dependencies.ts`
- `src/services/agents/*`
- `src/services/imageGenerationService.ts`
- `src/utils/itemInteraction.ts`

### Documentación

- `HANDOFF.md`
- `PLANNING.md`
- `docs/BUSINESS_TECH_SPEC.md`
- documentación de integración B2B si menciona categorías de tenant

---

## 9. Riesgos

### Riesgo 1. Duplicar semántica

Si dejamos al mismo tiempo:

- `verticalId` con semántica narrativa
- `itemInteractionMode` con semántica narrativa

acabaremos con dos fuentes de verdad.

Mitigación:

- definir desde el primer commit que la fuente de verdad narrativa es `itemInteractionMode`

### Riesgo 2. Copy incoherente

`wearable` no implica siempre el mismo verbo natural en español.

Ejemplos:

- un zapato se calza
- una camiseta se viste
- una gorra se lleva puesta

Mitigación:

- no intentar resolver la gramática perfecta en esta primera refactorización
- usar una formulación suficientemente robusta como:
  - "lleva puesto"
  - "la prenda o accesorio"
  - "el objeto que acompaña al protagonista"

### Riesgo 3. Cambio demasiado grande de una vez

Si mezclamos esta refactorización con:

- onboarding B2B
- auth
- Stripe
- dashboard tenant

la ejecución se volverá frágil.

Mitigación:

- hacer esta refactorización en un fork aislado
- validar primero que no rompe generación ni setup

---

## 10. Recomendaciones de implementación

### Recomendación A

Primero introducir el nuevo campo y usarlo solo en paralelo.

### Recomendación B

Después mover la lógica narrativa/visual a `itemInteractionMode`.

### Recomendación C

Solo al final limpiar o rebajar la importancia semántica de `verticalId`.

---

## 11. Definición de Done

La refactorización se considerará completa cuando:

- exista `itemInteractionMode` en `TenantConfig`
- todos los tenants tengan un valor explícito
- la narrativa/imagen deje de depender de `shoe-store` vs `fashion-store`
- `wearable` cubra correctamente zapatos y ropa
- la app compile y el flujo actual no se rompa
- la documentación principal quede actualizada

---

## 12. Orden de ejecución en fork

1. Crear fork o branch de trabajo aislado
2. Añadir tipo `ItemInteractionMode` y extender `TenantConfig`
3. Actualizar configs existentes
4. Reemplazar dependencias narrativas de `verticalId` por `itemInteractionMode`
5. Revisar copy visible del wizard
6. Validar build y flujo B2B/B2C actual
7. Actualizar documentación

---

## 13. Decisiones pendientes antes de implementar

Estas decisiones se pueden cerrar justo antes de empezar el fork:

- si mantenemos ambos tenants demo actuales
- si queremos introducir ya un tenant demo `interactive` o dejarlo para una segunda iteración

---

## 14. Recomendación final

Sí, esta refactorización tiene sentido y no parece especialmente peligrosa si se hace en dos pasos:

- introducir la nueva abstracción
- migrar la lógica hacia ella sin romper compatibilidad

La clave es no convertirla en una refactorización total del producto. Debe ser una limpieza de modelo, no una reinvención del sistema B2B.
