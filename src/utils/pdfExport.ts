// src/utils/pdfExport.ts
// Exportacion de cuentos a PDF con jsPDF (16:9 landscape)

import jsPDF from 'jspdf';
import type { ComicFace, TenantConfig } from '../types';

interface ExportOptions {
  pages: ComicFace[];
  heroName: string;
  tenantConfig: TenantConfig;
  onProgress?: (percent: number, message: string) => void;
}

export interface ExportedPdfAsset {
  blob: Blob;
  fileName: string;
}

// Formato libro horizontal 16:9 en mm
const PAGE_WIDTH = 320;
const PAGE_HEIGHT = 180;

// Layout principal
const MARGIN = 12;
const GUTTER = 8;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN * 2;
const PANEL_WIDTH = (CONTENT_WIDTH - GUTTER) / 2;
const PANEL_HEIGHT = CONTENT_HEIGHT;

const INK_BLACK = '#1E293B';
const PAPER = '#FCFBF8';

interface PdfImageAsset {
  dataUrl: string;
  width: number;
  height: number;
}

async function loadPdfImageAsset(url: string): Promise<PdfImageAsset> {
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
      resolve({
        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

function fitImageInBox(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);

  return {
    width: imageWidth * scale,
    height: imageHeight * scale,
  };
}

function drawSpreadBase(pdf: jsPDF, tenantConfig: TenantConfig): void {
  const { background } = tenantConfig.brandColors;
  const x = MARGIN;
  const y = MARGIN;

  pdf.setFillColor(background);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  pdf.setFillColor(PAPER);
  pdf.rect(x, y, CONTENT_WIDTH, CONTENT_HEIGHT, 'F');

  pdf.setDrawColor(INK_BLACK);
  pdf.setLineWidth(1.5);
  pdf.rect(x, y, CONTENT_WIDTH, CONTENT_HEIGHT);

  const dividerX = x + PANEL_WIDTH + GUTTER / 2;
  pdf.setDrawColor('#E8E8E8');
  pdf.setLineWidth(0.6);
  pdf.line(dividerX, y + 1, dividerX, y + CONTENT_HEIGHT - 1);
}

async function drawCoverPage(
  pdf: jsPDF,
  heroName: string,
  tenantConfig: TenantConfig,
  coverImageUrl?: string
): Promise<void> {
  const { primary } = tenantConfig.brandColors;
  drawSpreadBase(pdf, tenantConfig);

  const leftX = MARGIN;
  const rightX = MARGIN + PANEL_WIDTH + GUTTER;
  const panelY = MARGIN;

  if (coverImageUrl) {
    try {
      const imageAsset = await loadPdfImageAsset(coverImageUrl);
      const maxW = PANEL_WIDTH - 10;
      const maxH = PANEL_HEIGHT - 10;
      const { width: imgW, height: imgH } = fitImageInBox(
        imageAsset.width,
        imageAsset.height,
        maxW,
        maxH
      );

      const imgX = leftX + (PANEL_WIDTH - imgW) / 2;
      const imgY = panelY + (PANEL_HEIGHT - imgH) / 2;
      pdf.addImage(imageAsset.dataUrl, 'JPEG', imgX, imgY, imgW, imgH);
    } catch (e) {
      console.warn('No se pudo cargar imagen de portada:', e);
    }
  }

  const centerX = rightX + PANEL_WIDTH / 2;
  const centerY = panelY + PANEL_HEIGHT / 2;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(primary);
  pdf.text(`La Aventura de ${heroName}`, centerX, centerY - 8, { align: 'center' });

  pdf.setFillColor(primary);
  pdf.setDrawColor(INK_BLACK);
  pdf.setLineWidth(1);
  pdf.roundedRect(centerX - 32, centerY + 2, 64, 14, 7, 7, 'FD');
  pdf.setTextColor('#FFFFFF');
  pdf.setFontSize(12);
  pdf.text(tenantConfig.tenantName, centerX, centerY + 11, { align: 'center' });
}

async function drawStoryPage(
  pdf: jsPDF,
  page: ComicFace,
  pageNumber: number,
  tenantConfig: TenantConfig
): Promise<void> {
  const { primary, accent } = tenantConfig.brandColors;
  drawSpreadBase(pdf, tenantConfig);

  const leftX = MARGIN;
  const rightX = MARGIN + PANEL_WIDTH + GUTTER;
  const panelY = MARGIN;

  // Columna izquierda: imagen
  const imageFrameX = leftX + 4;
  const imageFrameY = panelY + 4;
  const imageFrameW = PANEL_WIDTH - 8;
  const imageFrameH = PANEL_HEIGHT - 8;

  pdf.setDrawColor('#D5D5D5');
  pdf.setLineWidth(0.4);
  pdf.rect(imageFrameX, imageFrameY, imageFrameW, imageFrameH);

  if (page.imageUrl) {
    try {
      const imageAsset = await loadPdfImageAsset(page.imageUrl);
      const { width: imgW, height: imgH } = fitImageInBox(
        imageAsset.width,
        imageAsset.height,
        imageFrameW - 4,
        imageFrameH - 4
      );

      const imgX = imageFrameX + (imageFrameW - imgW) / 2;
      const imgY = imageFrameY + (imageFrameH - imgH) / 2;
      pdf.addImage(imageAsset.dataUrl, 'JPEG', imgX, imgY, imgW, imgH);
    } catch (e) {
      console.warn(`No se pudo cargar imagen de página ${pageNumber}:`, e);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor('#9CA3AF');
      pdf.text('Sin imagen (modo mock)', leftX + PANEL_WIDTH / 2, panelY + PANEL_HEIGHT / 2, {
        align: 'center',
      });
    }
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor('#9CA3AF');
    pdf.text('Sin imagen', leftX + PANEL_WIDTH / 2, panelY + PANEL_HEIGHT / 2, {
      align: 'center',
    });
  }

  // Columna derecha: numero + texto (centrado vertical y horizontalmente)
  const rightCenterX = rightX + PANEL_WIDTH / 2;
  const textAreaWidth = PANEL_WIDTH - 24;

  const caption = (page.narrative?.caption || page.narrative?.scene || '').trim();
  const dialogue = (page.narrative?.dialogue || '').trim();

  // Font sizes (~50% larger than before)
  const CAPTION_SIZE = 19;
  const DIALOGUE_SIZE = 17;
  const CAPTION_LINE_H = 9.5;
  const DIALOGUE_LINE_H = 8.8;
  const CIRCLE_R = 7;
  const DECOR_H = 14;

  // Pre-calculate caption lines at the larger font size
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(CAPTION_SIZE);
  const captionLines = caption ? pdf.splitTextToSize(caption, textAreaWidth) as string[] : [];

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(DIALOGUE_SIZE);
  const dialogueLines = dialogue ? pdf.splitTextToSize(`"${dialogue}"`, textAreaWidth) as string[] : [];

  // Calculate total block height for vertical centering
  let blockHeight = CIRCLE_R * 2 + 10; // circle + gap after circle
  blockHeight += captionLines.length * CAPTION_LINE_H;
  if (dialogueLines.length > 0) {
    blockHeight += 8 + dialogueLines.length * DIALOGUE_LINE_H; // gap + dialogue
  }
  blockHeight += DECOR_H; // decoration at bottom

  // Start Y so the block is vertically centered in the panel
  let currentY = panelY + (PANEL_HEIGHT - blockHeight) / 2 + CIRCLE_R;

  // Page number circle (fill only, no stroke border)
  pdf.setFillColor(primary);
  pdf.circle(rightCenterX, currentY, CIRCLE_R, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor('#FFFFFF');
  pdf.text(String(pageNumber), rightCenterX, currentY + 4, { align: 'center' });

  currentY += CIRCLE_R + 10;

  // Caption text
  if (captionLines.length > 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(CAPTION_SIZE);
    pdf.setTextColor(INK_BLACK);

    for (const line of captionLines) {
      pdf.text(line, rightCenterX, currentY, { align: 'center' });
      currentY += CAPTION_LINE_H;
    }
  }

  // Dialogue text
  if (dialogueLines.length > 0) {
    currentY += 8;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(DIALOGUE_SIZE);
    pdf.setTextColor(primary);

    for (const line of dialogueLines) {
      pdf.text(line, rightCenterX, currentY, { align: 'center' });
      currentY += DIALOGUE_LINE_H;
    }
  }

  // Decoration
  currentY += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(accent);
  pdf.text('*   *   *', rightCenterX, currentY, { align: 'center' });
}

function drawBackCover(pdf: jsPDF, tenantConfig: TenantConfig): void {
  const { primary } = tenantConfig.brandColors;
  drawSpreadBase(pdf, tenantConfig);

  const rightX = MARGIN + PANEL_WIDTH + GUTTER;
  const panelY = MARGIN;
  const centerX = rightX + PANEL_WIDTH / 2;
  const panelCenterY = panelY + PANEL_HEIGHT / 2;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(46);
  pdf.text('*', centerX, panelCenterY - 38, { align: 'center' });

  pdf.setTextColor(primary);
  pdf.setFontSize(36);
  pdf.text('¡Fin!', centerX, panelCenterY - 10, { align: 'center' });

  pdf.setTextColor(INK_BLACK);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(16);
  pdf.text('Esperamos que hayas disfrutado', centerX, panelCenterY + 8, { align: 'center' });
  pdf.text('esta aventura magica', centerX, panelCenterY + 18, { align: 'center' });
}

export async function exportToPdf(options: ExportOptions): Promise<ExportedPdfAsset> {
  const { pages, heroName, tenantConfig, onProgress } = options;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PAGE_WIDTH, PAGE_HEIGHT],
  });

  const totalSteps = pages.length + 2;
  let currentStep = 0;

  const reportProgress = (message: string) => {
    currentStep += 1;
    const percent = Math.round((currentStep / totalSteps) * 100);
    onProgress?.(percent, message);
  };

  try {
    reportProgress('Generando portada...');
    await drawCoverPage(pdf, heroName, tenantConfig, pages[0]?.imageUrl);

    for (let i = 0; i < pages.length; i++) {
      pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'landscape');
      reportProgress(`Pagina ${i + 1} de ${pages.length}...`);
      await drawStoryPage(pdf, pages[i], i + 1, tenantConfig);
    }

    pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'landscape');
    reportProgress('Generando contraportada...');
    drawBackCover(pdf, tenantConfig);

    const fileName = `${heroName.replace(/\s+/g, '_')}_aventura_magica.pdf`;
    const blob = pdf.output('blob');
    onProgress?.(100, 'PDF listo');
    return { blob, fileName };
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
}

