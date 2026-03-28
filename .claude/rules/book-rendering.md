---
paths:
  - "src/components/Book.tsx"
  - "src/components/Panel.tsx"
  - "src/utils/pdfExport.ts"
---

# Book UI & Experiencia de Lectura

## Estructura de Datos de una Página

```typescript
interface ComicFace {
  id: string;
  type: 'cover' | 'story' | 'back_cover';
  imageUrl?: string;                // URL o data URI de la imagen generada
  narrative?: Beat;                 // Beat del Storytelling Agent
  choices: string[];                // Opciones en Decision Pages
  resolvedChoice?: string;          // Opción elegida por el usuario
  isLoading: boolean;
  pageIndex?: number;
  isDecisionPage?: boolean;
}

interface Beat {
  caption?: string;                 // Texto narrativo (calibrado por Age Group)
  dialogue?: string;                // Diálogo de personajes
  scene: string;                    // Descripción de la escena
  visualDirection?: string;         // Brief del Visual Brief Agent
  choices: string[];                // Vacío si no es decision page
  focus_char: 'hero' | 'friend' | 'other';
}
```

## Layout del Libro

### Contenedor Principal
- Fondo oscuro o patrón sutil para que el libro resalte.
- Libro centrado con relación de aspecto ~2:3 (similar a iPad vertical).
- Sombra paralela suave y amplia.
- Efecto de grosor de páginas (línea sutil en borde derecho).

### Contenido de Página (Panel)
```
┌─────────────────────┐
│                     │
│    IMAGEN (60-70%)  │  ← Bordes redondeados o enmarcado clásico
│                     │
│                     │
├─────────────────────┤
│                     │
│  TEXTO / CAPTION    │  ← Fondo ligeramente crema
│  (Nunito, grande)   │  ← Legible para niños y padres
│                     │
└─────────────────────┘
```

### Navegación
- Flechas flotantes a los lados (izquierda/derecha) estilo burbuja.
- Indicador de página: "Page 2 of 10".
- Transición slide suave o flip 3D entre páginas.

### Decision Pages
- Imagen se oscurece ligeramente (overlay semitransparente).
- Dos botones gigantes superpuestos con animación de rebote suave.
- Opción A y Opción B con colores diferenciados.
- Al elegir, se resuelve el beat y continúa la generación.

## Generación Progresiva

```typescript
// Las primeras páginas son legibles mientras las siguientes se generan
// Patrón: generar página N+1 mientras el usuario lee página N

// Estado de carga contextualizado:
const LOADING_MESSAGES = [
  "Drawing your magic {itemLabel}...",     // itemLabel dinámico
  "Painting the adventure...",
  "Mixing magical colors...",
  "The story is coming to life...",
];
```

## PDF Export

```typescript
// utils/pdfExport.ts — extraído de App.tsx
// Usa jsPDF client-side
// Portrait orientation, ratio libro/cómic
// Alta resolución para impresión

import jsPDF from 'jspdf';

export async function exportToPDF(pages: ComicFace[]): Promise<void> {
  const pdf = new jsPDF('portrait', 'mm', 'a4');

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();

    const page = pages[i];
    if (page.imageUrl) {
      pdf.addImage(page.imageUrl, 'JPEG', 10, 10, 190, 180);
    }
    if (page.narrative?.caption) {
      pdf.setFontSize(14);
      pdf.text(page.narrative.caption, 15, 200, { maxWidth: 180 });
    }
  }

  pdf.save('nubekids-story.pdf');
}
```

## Estados Visuales

| Estado | Visual |
|--------|--------|
| **Loading** | Lápiz dibujando / zapatillas caminando + texto parpadeante |
| **Ready** | Página completa con imagen + texto |
| **Decision** | Imagen oscurecida + 2 botones rebotando |
| **Error** | Mensaje amigable + botón "Try Again" |

## Anti-Patterns

- ❌ No mostrar página vacía mientras carga — siempre feedback visual
- ❌ No cargar todas las imágenes en memoria a la vez — generación progresiva
- ❌ No hardcodear textos de loading — usar itemLabel del tenant
- ❌ No bloquear navegación durante generación — permitir volver a páginas anteriores
