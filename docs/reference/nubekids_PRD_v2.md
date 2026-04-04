# Product Requirement Document (PRD) v2.0
# NubeKids — AI Storybook Engine · SaaS Multitenant B2B Platform

> **Versión:** 2.0  
> **Estado:** Draft  
> **Fecha:** 2026-03-24  
> **Autores:** Equipo NubeKids

> **Nota histórica 2026-04-04:** Este PRD describe una etapa previa del modelo. Hoy `shoe-store` y `fashion-store` no deben interpretarse como categorías narrativas del producto, sino como verticales/tenants demo legacy. La fuente de verdad actual para el comportamiento del objeto es `itemInteractionMode`.

---

## 1. Executive Summary & Product Vision

### 1.1 Concepto

**NubeKids** es una plataforma SaaS multitenant B2B que permite a propietarios de tiendas de moda y calzado infantil ofrecer a sus clientes una experiencia única de post-compra (up-sell): generar cuentos digitales personalizados e ilustrados con IA donde el niño es el protagonista y el artículo recién comprado (zapatos, prenda, accesorio) tiene poderes mágicos en la historia.

El **core tecnológico** es un motor de generación de cuentos basado en:
1. Un **sistema multiagente** con roles de expertos en neuroeducación, psicología infantil y storytelling creativo.
2. Un **RAG (Retrieval-Augmented Generation)** construido sobre una biblioteca científica curada de obras expertas en desarrollo infantil, psicología evolutiva y escritura creativa.
3. Un motor de **personalización pedagógica** que adapta narrativa, vocabulario e ilustraciones a la edad del niño y a sus necesidades de desarrollo específicas.

### 1.2 Modelo de Negocio

```
CAPA 1 — PLATFORM (NubeKids)
  └─ Proporciona el core: motor IA, RAG, agentes, infraestructura, dashboard de gestión.

CAPA 2 — TENANTS (Tiendas B2B)
  └─ Tiendas de calzado infantil, tiendas de moda infantil, marketplaces, cadenas retail.
  └─ Cada tenant tiene su propio workspace, branding, system prompts y configuración.

CAPA 3 — END USERS (Padres/Familias B2C)
  └─ Clientes finales de los tenants que generan y reciben los cuentos.
  └─ Existe también una vertical B2C directa gestionada por NubeKids.
```

### 1.3 Verticales Definidas (V1, modelo histórico)

| Vertical ID | Nombre | Descripción | Item Mágico |
|---|---|---|---|
| `shoe-store` | Magic Sneakers | Tiendas de calzado infantil | Zapatos / Zapatillas |
| `fashion-store` | Magic Wardrobe | Tiendas de moda infantil | Prenda o accesorio |
| `direct-b2c` | NubeKids Stories | Canal B2C directo de NubeKids | Genérico / editable por usuario |

Lectura actual recomendada:

- `shoe-store-default` y `fashion-store-default` se mantienen por compatibilidad
- ambos comparten actualmente `itemInteractionMode = wearable`
- `direct-b2c` usa `itemInteractionMode = generic`

---

## 2. Target Audience

### 2.1 Clientes B2B (Tenants)

- **Propietarios de tiendas de calzado infantil** (independientes y cadenas) que buscan diferenciación y aumento del ticket medio.
- **Propietarios de tiendas de moda infantil** que quieren ofrecer experiencias memorables de post-compra.
- **Marketplaces y plataformas de e-commerce infantil** que desean integrar el servicio como feature premium.

### 2.2 Usuarios Finales B2C (End Users de los Tenants)

- **Padres, madres y tutores** (25–45 años) compradores en tiendas adheridas.
- **Abuelos y familiares** que buscan regalos personalizados significativos.
- **Educadores** que quieren material de lectura personalizado para sus alumnos.

### 2.3 Lectores (Consumidores del Producto Final)

- **Niños de 3 a 10 años**, segmentados en tres grupos de edad para calibrar el contenido generado.

---

## 3. Problem Statement & Value Proposition

### 3.1 El Problema (para los Tenants B2B)

Las tiendas de moda y calzado infantil compiten en un mercado saturado donde el producto físico ya no diferencia. El momento del checkout es una oportunidad de up-sell desaprovechada, y la fidelización post-compra es casi inexistente en el sector independiente.

### 3.2 El Problema (para las Familias)

Los cuentos infantiles tradicionales son genéricos. Los libros personalizados existentes (con el nombre del niño) tienen valor simbólico pero no capturan la esencia visual real del niño, no incluyen sus objetos favoritos y no tienen ningún componente educativo o psicopedagógico adaptado a sus necesidades específicas de desarrollo.

### 3.3 La Propuesta de Valor

**Para Tenants:**
- Up-sell natural en checkout que aumenta el ticket medio y genera una experiencia memorable post-compra.
- Diferenciación radical frente a competidores.
- Fidelización: los padres recuerdan dónde compraron el artículo mágico del cuento.
- Dashboard de analítica y gestión con branding propio.

**Para Familias:**
- Un cuento donde su hijo ES el protagonista visual (foto real).
- El artículo recién comprado tiene superpoderes en la historia.
- El cuento está **pedagógicamente diseñado** por un sistema multiagente experto en neuroeducación y psicología infantil.
- Personalizable según la edad, etapa de desarrollo y necesidades del niño.
- Descargable como PDF de alta calidad.

---

## 4. Arquitectura de la Plataforma (Multitenancy)

### 4.1 Modelo de Tenancy

Cada tenant dispondrá de un **workspace aislado** con:

- **Tenant Config** (almacenada en base de datos):
  - `tenant_id`, `tenant_name`, `vertical_id`
  - `brand_colors`, `brand_logo`, `custom_domain`
  - `item_label` (e.g., "zapatos", "abrigo", "mochila")
  - `item_placeholder_text` (texto guía para el usuario final)
  - `base_system_prompt` (prompt base editable por el tenant)
  - `active_languages[]`, `active_genres[]`
  - `pedagogy_enabled` (boolean)
  - `rag_collections[]` (colecciones RAG asignadas al tenant)

- **Embedding Point** (punto de integración en el checkout del tenant):
  - Widget embebible (iframe / Web Component) con el `tenant_id` parametrizado.
  - API REST para integración headless con plataformas e-commerce (Shopify, WooCommerce, PrestaShop).
  - El checkout inyecta automáticamente el `item_model` (nombre/modelo del artículo comprado) en el `system_prompt` del agente.

### 4.2 Flujo de Inyección del Artículo (Up-Sell Checkout)

```
CHECKOUT TIENDA
     │
     ├─ [Artículo comprado: "Nike Air Max 90 Kids, talla 32, color rojo"]
     │
     └─► Widget NubeKids activado
              │
              ├─ item_model = "Nike Air Max 90 Kids, talla 32, color rojo"  ← inyectado automáticamente
              ├─ item_label = "zapatos"  ← definido por vertical del tenant
              │
              └─► Setup Screen del tenant (con branding propio)
                       │
                       └─► Motor IA genera cuento donde esos zapatos específicos son mágicos
```

El campo `item_model` puede ser:
- **Auto-inyectado** desde el checkout del tenant (integración API).
- **Editable por el usuario final** si el tenant lo permite.
- **Genérico** si no se proporciona (la IA inventa unas zapatillas/prenda mágica sin referencia de marca).

---

## 5. Motor de IA: Sistema Multiagente + RAG Pedagógico

### 5.1 Filosofía

El corazón diferencial de NubeKids no es solo generar imágenes bonitas. Es generar **cuentos con propósito**. Cada cuento es creado por un ensemble de agentes que simulan la colaboración entre:

1. Un **Neuroeducador** experto en etapas de desarrollo infantil.
2. Un **Psicólogo Infantil** especializado en inteligencia emocional y conducta.
3. Un **Escritor Creativo** maestro del storytelling para niños.
4. Un **Ilustrador Conceptual** que define el brief visual de cada panel.

### 5.2 RAG — Base de Conocimiento Científico-Creativo

La plataforma construirá y mantendrá un RAG estructurado en las siguientes colecciones:

#### Colección A: Neuroeducación y Desarrollo Infantil
- Obras de referencia sobre etapas de desarrollo cognitivo y emocional (Piaget, Vygotsky, Gardner).
- Investigación sobre aprendizaje basado en narrativas.
- Guías sobre cómo los cuentos refuerzan habilidades cognitivas por tramos de edad.

#### Colección B: Psicología Infantil y Conducta
- Teorías del apego y su reflejo en narrativas saludables.
- Marcos para trabajar emociones a través de historias (bibliotherapy).
- Estrategias narrativas para abordar miedos, conflictos sociales, autoestima, transiciones vitales.

#### Colección C: Storytelling y Escritura Creativa Infantil
- Estructuras narrativas para niños (el viaje del héroe simplificado, el arco de 3 actos).
- Técnicas de escritura para cada tramo de edad (vocabulario, longitud de frase, ritmo).
- Obras de referencia: Roald Dahl, Mo Willems, Sendak — análisis de técnicas.

#### Colección D: Briefs Artísticos por Estilo
- Referencias visuales y prompts maestros por género artístico (3D Animation, Claymation, Fairytale, Anime).
- Guidelines de coherencia visual para ilustración infantil.

### 5.3 Modos de Generación

#### Modo A — Cuento Estándar (sin personalización pedagógica)
Cuento de aventuras inspirador y entretenido con el niño como protagonista y el artículo como objeto mágico. Sin abordaje de ninguna problemática específica.

#### Modo B — Cuento Pedagógico Personalizado
Activado por un **formulario de personalización** opcional previo a la generación. El sistema multiagente usa las respuestas para diseñar un cuento con intención educativa específica.

El formulario recoge información sobre:

| Categoría | Ejemplos de inputs |
|---|---|
| **Retos de comportamiento a trabajar** | Gestión de rabietas, compartir con otros, miedos nocturnos, celos de hermanos |
| **Habilidades incipientes a reforzar** | Lectura, autonomía, creatividad, resolución de problemas |
| **Estado emocional actual** | Cambio de colegio, llegada de un hermano, pérdida de un familiar, divorcio |
| **Motivación e inspiración** | Futbolista, bailarina, astronauta, artista |
| **Valores a transmitir** | Honestidad, empatía, perseverancia, respeto a la diversidad |

### 5.4 Segmentación por Edad (Age Mode)

Un parámetro **Age Group** (reemplaza y amplía el anterior "Novel Mode") ajusta:

| Age Group | Rango | Vocabulario | Longitud por página | Estructura | Complejidad emocional |
|---|---|---|---|---|---|
| `tiny` | 3–4 años | Muy simple, frases cortas, onomatopeyas | 1–2 frases | Lineal, repetitiva | Emociones básicas |
| `little` | 5–6 años | Simple, ampliando vocab | 3–4 frases | Arco simple | Emociones secundarias |
| `reader` | 7–10 años | Intermedio, vocabulario rico | Párrafo completo | Arco complejo, giros | Dilemas morales leves |

El Age Group es **obligatorio** en el setup y reemplaza al "Novel Mode" anterior (que pasa a ser un sub-parámetro interno del Age Group `reader`).

---

## 6. User Stories

### 6.1 Tenant (Administrador de Tienda)

- **T1:** Como propietario de tienda, quiero integrar el widget de NubeKids en mi checkout con una línea de código para que mis clientes vean la oferta al finalizar la compra.
- **T2:** Como tenant, quiero personalizar los colores, logo y textos del widget para que la experiencia esté completamente alineada con mi marca.
- **T3:** Como tenant, quiero que el modelo del artículo comprado se inyecte automáticamente en el cuento sin que el cliente tenga que escribirlo.
- **T4:** Como tenant, quiero acceder a un dashboard con métricas de uso (cuentos generados, tasa de conversión del up-sell, rating de satisfacción).
- **T5:** Como tenant, quiero poder editar el prompt base de mi vertical para ajustar el tono y estilo de los cuentos a mi identidad de marca.

### 6.2 Usuario Final (Padre/Tutor)

- **U1:** Como usuario, quiero subir la foto de mi hijo para que sea el protagonista visual del cuento.
- **U2:** Como usuario, quiero que los zapatos que acabo de comprar sean el objeto mágico de la historia (ya pre-rellenados desde el checkout).
- **U3:** Como usuario, quiero indicar la edad de mi hijo para que el cuento tenga el vocabulario y la complejidad adecuados.
- **U4:** Como usuario, quiero poder completar un formulario de personalización pedagógica para que el cuento trabaje algo específico con mi hijo (opcional).
- **U5:** Como usuario, quiero añadir a un co-protagonista (amigo/hermano) con sus propios zapatos.
- **U6:** Como usuario, quiero elegir el estilo visual del cuento (3D, cuento clásico, anime, etc.).
- **U7:** Como usuario, quiero descargar el cuento terminado como PDF de alta calidad.
- **U8:** Como usuario, quiero poder tomar decisiones en ciertos puntos del cuento para hacerlo interactivo.

---

## 7. Functional Requirements

### 7.1 Plataforma de Gestión (Admin Panel — NubeKids)

- CRUD de tenants con configuración de vertical, branding y system prompts.
- Gestión de colecciones RAG: carga de documentos, indexación, asignación a tenants.
- Monitorización de uso y costes de API por tenant.
- Gestión de planes y facturación (integración Stripe).

### 7.2 Dashboard de Tenant

- Vista de métricas de uso propias.
- Editor de configuración (branding, textos, prompts editables dentro de límites seguros).
- Generación y gestión de API keys para integración checkout.
- Previsualización del widget con su configuración actual.

### 7.3 Widget / App de Generación (End User)

#### Setup Screen — Campos Obligatorios
- Subida de foto del Héroe (protagonista).
- Subida de foto del artículo mágico (zapatos/prenda). Auto-rellenado desde checkout si disponible.
- **Age Group selector** (tiny 3–4 / little 5–6 / reader 7–10). — NUEVO, OBLIGATORIO.
- Nombre del protagonista (campo de texto).

#### Setup Screen — Campos Opcionales
- Subida de foto del Co-Protagonista + su artículo mágico.
- Selector de género artístico.
- Selector de idioma.
- **Formulario de personalización pedagógica** (colapsado por defecto, expandible). — NUEVO.
  - Checkboxes y sliders por categorías (ver sección 5.3).
  - Campo de texto libre para contexto adicional.
- Campo de texto editable `item_model` (si el tenant lo permite).

#### Validación
- Botón "START ADVENTURE" deshabilitado hasta que: foto del Héroe + artículo mágico + Age Group estén completados.

### 7.4 Motor de Generación

- **Orchestrator Agent:** Coordina los sub-agentes y el RAG para construir el brief narrativo completo antes de iniciar la generación de páginas.
- **Narrative Agent (Neuroeducador + Psicólogo):** Genera el arco narrativo con intención pedagógica según el perfil del niño.
- **Storytelling Agent (Escritor Creativo):** Convierte el arco en beats concretos con texto calibrado por Age Group.
- **Visual Brief Agent (Ilustrador Conceptual):** Genera el prompt de imagen para cada página, con instrucciones de consistencia de personajes.
- **Image Generation:** Multimodal con referencias de imagen (Hero Face, Hero Shoe/Item, Friend Face, Friend Shoe/Item).
- **Content Moderation:** Guardrails estrictos en todos los agentes. Output 100% wholesome, age-appropriate, libre de violencia o temas oscuros.
- **Branching interactivo:** Decision Pages en las que el usuario elige entre dos opciones, ramificando la narrativa.

### 7.5 Libro Digital (Reading Experience)

- Simulación de libro físico (cover, páginas internas, back cover).
- Navegación por páginas (adelante/atrás).
- Generación progresiva: las primeras páginas son legibles mientras las siguientes se generan en background.
- Loading states contextualizados ("Dibujando la magia de tus zapatos...").

### 7.6 Export & Reset

- **PDF Download:** Portrait orientation, ratio book/comic, alta resolución. Incluye todas las páginas generadas.
- **Reset:** Limpia todo el estado y vuelve al Setup.

---

## 8. Integración Checkout (API de Tenants)

### 8.1 Widget Embebible

```html
<!-- Ejemplo de integración en checkout -->
<script src="https://cdn.nubekids.io/widget.js"></script>
<nubekids-upsell
  tenant-id="shoe-store-acme-001"
  item-model="Nike Air Max 90 Kids Rojo Talla 32"
  item-category="shoes"
  lang="es"
></nubekids-upsell>
```

### 8.2 API REST (Headless)

- `POST /api/v1/sessions` — Crea una sesión de generación con el `item_model` inyectado.
- `GET /api/v1/sessions/:id` — Recupera el estado de una sesión.
- Autenticación por API Key de tenant (Bearer Token).

---

## 9. Non-Functional Requirements

| Requisito | Especificación |
|---|---|
| **Multitenancy** | Aislamiento completo de datos y configuración entre tenants. |
| **Performance** | Imágenes comprimidas/redimensionadas client-side antes de enviarlas a la API. Generación progresiva para TTI < 5s en primera página. |
| **Responsiveness** | Excelente experiencia en desktop, tablet y mobile. |
| **Privacy** | Las fotos del niño no se almacenan en backend propio. Solo en memoria de sesión del navegador y enviadas directamente a la API de IA durante la sesión. |
| **Seguridad** | Las API keys de tenants se almacenan cifradas. Los prompts de tenants tienen sandbox para evitar inyección de instrucciones dañinas. |
| **Escalabilidad** | Arquitectura serverless o containerizada por tenant para escalar horizontalmente. |
| **i18n** | UI de la plataforma en ES/EN. Cuentos generables en: Español, Inglés, Francés, Portugués, Italiano. |

---

## 10. Roadmap & Out of Scope

### V1 — Core (Actual Scope)

- [x] Motor de generación single-tenant funcional (Magic Sneakers).
- [ ] Arquitectura multitenante base.
- [ ] Vertical `shoe-store` (Magic Sneakers) como tenant.
- [ ] Vertical `fashion-store` (Magic Wardrobe) como tenant.
- [ ] Vertical `direct-b2c` (NubeKids Stories) como tenant B2C.
- [ ] Age Group selector (3 niveles).
- [ ] Formulario de personalización pedagógica (Modo B).
- [ ] Sistema multiagente base (Orchestrator + Narrative + Storytelling + Visual Brief).
- [ ] RAG v1 (colecciones A, B, C cargadas manualmente).
- [ ] Widget embebible básico.
- [ ] Dashboard de tenant básico.

### V2 — Enhancement

- [ ] Narración en audio (Text-to-Speech con voz personalizada por tenant).
- [ ] Integración nativa con Shopify, WooCommerce, PrestaShop.
- [ ] Guardado en la nube de cuentos generados (cuenta de usuario final).
- [ ] RAG auto-actualizable (pipeline de ingestión de nuevas fuentes).
- [ ] Video/animación de páginas.
- [ ] Impresión bajo demanda (integración con print-on-demand).
- [ ] Vertical educativa (colegios y centros educativos).
- [ ] Analytics avanzados de impacto pedagógico.

---

## 11. Métricas de Éxito

| Métrica | Objetivo V1 |
|---|---|
| Tasa de conversión del up-sell en checkout | > 8% |
| Cuentos completados / cuentos iniciados | > 65% |
| Rating de satisfacción de usuarios finales | > 4.5 / 5 |
| Tiempo hasta primera página visible | < 5 segundos |
| NPS de tenants | > 50 |
