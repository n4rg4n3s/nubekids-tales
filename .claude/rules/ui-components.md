---
paths:
  - "src/components/**/*.tsx"
  - "src/components/**/*.ts"
---

# UI Components & Design System — NubeKids

## Filosofía Visual

El Design Document define tres principios: **Tactile** (botones como objetos físicos), **Playful** (colores vibrantes, tipografías redondeadas, micro-interacciones), **Focused** (reducir ruido, un paso a la vez).

## Paleta de Colores (CSS Variables)

```css
:root {
  --nk-bg: #FDFBF7;           /* Soft Cream — fondo principal */
  --nk-primary: #8B5CF6;       /* Magic Purple — marca y acentos */
  --nk-accent: #FBBF24;        /* Sneaker Yellow — CTAs principales */
  --nk-secondary-blue: #38BDF8;/* Sky Blue — UI secundaria */
  --nk-success: #34D399;       /* Mint Green — estados de éxito */
  --nk-ink: #1E293B;           /* Ink Black — texto y bordes */

  /* Overrideables por tenant */
  --brand-primary: var(--nk-primary);
  --brand-accent: var(--nk-accent);
  --brand-bg: var(--nk-bg);
}
```

## Tipografía

- **Display / Headings:** Fredoka One o Bangers (Google Fonts). Gruesa, redondeada.
- **Body / UI Text:** Nunito o Quicksand. Sans-serif redondeada, legible.

```css
.heading-magic { font-family: 'Fredoka One', cursive; }
.body-text { font-family: 'Nunito', sans-serif; }
```

## Componentes Core

### Botón Táctil (TactileButton)
```css
.tactile-btn {
  border: 3px solid var(--nk-ink);
  box-shadow: 4px 4px 0px var(--nk-ink);
  border-radius: 12px;
  font-family: 'Fredoka One', cursive;
  font-size: 1.1rem;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.tactile-btn:hover {
  box-shadow: 2px 2px 0px var(--nk-ink);
  transform: translate(2px, 2px);
}

.tactile-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: 4px 4px 0px var(--nk-ink);
  transform: none;
}
```

### Tarjeta de Upload (UploadCard)
```css
.upload-card {
  background: white;
  border: 4px dashed var(--brand-primary);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.upload-card--success {
  border: 4px solid var(--nk-success);
  border-style: solid;
}

/* Imagen subida con efecto Polaroid */
.upload-card--success img {
  transform: rotate(-2deg);
  border: 3px solid white;
  box-shadow: 2px 2px 8px rgba(0,0,0,0.15);
}
```

### Dropdown Custom (NO usar <select> nativo)
Los selectores de Genre y Language deben parecer botones grandes que despliegan opciones.
Implementar como componente React con Listbox pattern (accesible).

## Pantallas Principales

### Screen 1: API Key Modal
- Modal centrado con fondo blur
- Icono de llave mágica
- Input con borde grueso, placeholder amigable
- Botón accent: "ENTER MULTIVERSE"

### Screen 2: Setup Dashboard
- **Desktop:** 2 columnas (Cast + Story). **Mobile:** stacked.
- Contenedor principal con ligera rotación (1°) para romper rigidez.
- **Age Group Selector** — OBLIGATORIO, visual, con iconos por grupo.
- **PedagogyForm** — Colapsable, chips seleccionables con emojis.
- **Start Adventure** — Botón gigante a todo ancho, deshabilitado sin Hero + Item + AgeGroup.

### Screen 3: Book UI
- Fondo oscuro/patrón sutil para que el libro resalte.
- Libro centrado con sombra amplia y efecto de grosor de páginas.
- Imagen 60-70% superior, texto en caja crema inferior.
- Flechas de navegación flotantes estilo burbuja.
- **Decision Pages:** imagen oscurecida + 2 botones superpuestos con rebote.

### Screen 4: End & Export
- Ilustración de celebración.
- Botón primario: "DOWNLOAD STORY" (PDF).
- Botón secundario: "CREATE NEW STORY".

## Animaciones (Framer Motion o CSS puro)

1. **Pow/Pop Enter:** Start Adventure → formulario hace zoom + sale volando, revela libro.
2. **Page Turn:** Slide suave o flip 3D entre páginas.
3. **Loading State:** Lápiz dibujando / zapatillas caminando + "Drawing your magic shoes..." parpadeando.
4. **Hover States:** `transform: scale(1.05)` en todos los elementos interactivos.
5. **Upload Success:** Animación "pop" + badge verde "✓ READY".

## Responsive

- **Mobile first.** Stacked layout por defecto.
- **Breakpoint desktop:** 768px para columnas lado a lado.
- **Botones grandes** para pantallas táctiles (min 48px touch target).
- **Imágenes de preview** claramente visibles antes de generar.

## Accesibilidad

- Botones con `aria-label` descriptivo.
- Contraste suficiente (Ink Black sobre Cream = ratio > 7:1).
- Focus visible en todos los elementos interactivos.
- Alt text en imágenes generadas: "Illustration of [scene description]".

## Anti-Patterns

- ❌ No usar `<select>` nativo — implementar dropdowns custom.
- ❌ No usar colores hardcodeados — usar CSS variables.
- ❌ No ignorar estados de loading — cada generación necesita feedback visual.
- ❌ No olvidar el estado disabled del botón Start Adventure.
- ❌ No usar fuentes genéricas (Inter, Roboto) — usar Fredoka/Nunito del Design System.
