// src/utils/pdfExport.ts
// Exportación de cuentos a PDF con jsPDF
//
// INSTALACIÓN: npm install jspdf

import jsPDF from 'jspdf';
import type { ComicFace, TenantConfig } from '../types';

// ============================================================================
// TIPOS
// ============================================================================

interface ExportOptions {
  pages: ComicFace[];
  heroName: string;
  tenantConfig: TenantConfig;
  onProgress?: (percent: number, message: string) => void;
}

// ============================================================================
// CONSTANTES
// ============================================================================

// Tamaño A4 en mm (portrait)
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

// Márgenes
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

// Colores
const INK_BLACK = '#1E293B';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convierte URL de imagen a base64
 */
async function imageUrlToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Wrap text para que quepa en un ancho máximo
 */
function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = pdf.getTextWidth(testLine);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// ============================================================================
// FUNCIONES DE PÁGINA
// ============================================================================

/**
 * Dibuja la portada
 */
async function drawCoverPage(
  pdf: jsPDF,
  heroName: string,
  tenantConfig: TenantConfig,
  coverImageUrl?: string
): Promise<void> {
  const { primary, background } = tenantConfig.brandColors;

  // Fondo
  pdf.setFillColor(background);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Imagen de portada (si existe)
  if (coverImageUrl) {
    try {
      const imgData = await imageUrlToBase64(coverImageUrl);
      const imgWidth = CONTENT_WIDTH * 0.8;
      const imgHeight = imgWidth * (5 / 4); // Ratio 4:5
      const imgX = (PAGE_WIDTH - imgWidth) / 2;
      const imgY = 40;

      // Marco de la imagen
      pdf.setDrawColor(INK_BLACK);
      pdf.setLineWidth(1);
      pdf.rect(imgX - 2, imgY - 2, imgWidth + 4, imgHeight + 4);

      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
    } catch (e) {
      console.warn('No se pudo cargar imagen de portada:', e);
    }
  }

  // Título
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(primary);
  pdf.text(`La Aventura de ${heroName}`, PAGE_WIDTH / 2, 200, { align: 'center' });

  // Subtítulo
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(INK_BLACK);
  pdf.text('Un cuento mágico creado para ti ✨', PAGE_WIDTH / 2, 215, { align: 'center' });

  // Badge del tenant
  pdf.setFontSize(12);
  pdf.setTextColor(primary);
  pdf.text(tenantConfig.tenantName, PAGE_WIDTH / 2, 240, { align: 'center' });
}

/**
 * Dibuja una página del cuento (imagen + texto)
 */
async function drawStoryPage(
  pdf: jsPDF,
  page: ComicFace,
  pageNumber: number,
  tenantConfig: TenantConfig
): Promise<void> {
  const { primary, accent, background } = tenantConfig.brandColors;

  // Fondo
  pdf.setFillColor(background);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Imagen (60% superior de la página)
  if (page.imageUrl) {
    try {
      const imgData = await imageUrlToBase64(page.imageUrl);
      const imgWidth = CONTENT_WIDTH;
      const imgHeight = 140; // Altura fija para la imagen
      const imgX = MARGIN;
      const imgY = MARGIN;

      // Marco
      pdf.setDrawColor(INK_BLACK);
      pdf.setLineWidth(0.5);
      pdf.rect(imgX - 1, imgY - 1, imgWidth + 2, imgHeight + 2);

      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
    } catch (e) {
      console.warn(`No se pudo cargar imagen de página ${pageNumber}:`, e);
    }
  }

  // Número de página (círculo)
  const circleY = 170;
  pdf.setFillColor(primary);
  pdf.circle(PAGE_WIDTH / 2, circleY, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor('#FFFFFF');
  pdf.text(String(pageNumber), PAGE_WIDTH / 2, circleY + 4, { align: 'center' });

  // Texto del cuento
  const textY = 190;
  const caption = page.narrative?.caption || page.narrative?.scene || '';

  if (caption) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    pdf.setTextColor(INK_BLACK);

    const lines = wrapText(pdf, caption, CONTENT_WIDTH);
    let currentY = textY;

    lines.forEach(line => {
      pdf.text(line, PAGE_WIDTH / 2, currentY, { align: 'center' });
      currentY += 7;
    });

    // Diálogo (si existe)
    if (page.narrative?.dialogue) {
      currentY += 5;
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(primary);

      const dialogueLines = wrapText(pdf, `"${page.narrative.dialogue}"`, CONTENT_WIDTH);
      dialogueLines.forEach(line => {
        pdf.text(line, PAGE_WIDTH / 2, currentY, { align: 'center' });
        currentY += 7;
      });
    }
  }

  // Decoración inferior
  pdf.setFontSize(14);
  pdf.setTextColor(accent);
  pdf.text('✦  ✦  ✦', PAGE_WIDTH / 2, PAGE_HEIGHT - 20, { align: 'center' });
}

/**
 * Dibuja la contraportada
 */
function drawBackCover(
  pdf: jsPDF,
  tenantConfig: TenantConfig
): void {
  const { primary, background } = tenantConfig.brandColors;

  // Fondo
  pdf.setFillColor(background);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Estrella
  pdf.setFontSize(60);
  pdf.text('🌟', PAGE_WIDTH / 2, 100, { align: 'center' });

  // Título
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(32);
  pdf.setTextColor(primary);
  pdf.text('¡Fin!', PAGE_WIDTH / 2, 140, { align: 'center' });

  // Mensaje
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(INK_BLACK);
  pdf.text('Esperamos que hayas disfrutado', PAGE_WIDTH / 2, 165, { align: 'center' });
  pdf.text('esta aventura mágica', PAGE_WIDTH / 2, 175, { align: 'center' });

  // Créditos
  pdf.setFontSize(11);
  pdf.setTextColor(primary);
  pdf.text(`Creado con ${tenantConfig.tenantName}`, PAGE_WIDTH / 2, 220, { align: 'center' });

  // Fecha
  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  pdf.setFontSize(10);
  pdf.setTextColor(INK_BLACK);
  pdf.text(today, PAGE_WIDTH / 2, 235, { align: 'center' });
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

/**
 * Genera y descarga el PDF del cuento
 */
export async function exportToPdf(options: ExportOptions): Promise<void> {
  const { pages, heroName, tenantConfig, onProgress } = options;

  // Crear PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalSteps = pages.length + 2; // portada + páginas + contraportada
  let currentStep = 0;

  const reportProgress = (message: string) => {
    currentStep++;
    const percent = Math.round((currentStep / totalSteps) * 100);
    onProgress?.(percent, message);
  };

  try {
    // 1. Portada
    reportProgress('Generando portada...');
    await drawCoverPage(pdf, heroName, tenantConfig, pages[0]?.imageUrl);

    // 2. Páginas del cuento
    for (let i = 0; i < pages.length; i++) {
      pdf.addPage();
      reportProgress(`Página ${i + 1} de ${pages.length}...`);
      await drawStoryPage(pdf, pages[i], i + 1, tenantConfig);
    }

    // 3. Contraportada
    pdf.addPage();
    reportProgress('Generando contraportada...');
    drawBackCover(pdf, tenantConfig);

    // Descargar
    const fileName = `${heroName.replace(/\s+/g, '_')}_aventura_magica.pdf`;
    pdf.save(fileName);

    onProgress?.(100, '¡PDF listo!');

  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
}
