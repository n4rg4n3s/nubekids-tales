// src/utils/pdfExport.ts
import { jsPDF } from 'jspdf';
import type { ComicFace } from '../types';

interface ExportOptions {
  title?: string;
  author?: string;
  quality?: number; // 0.1 to 1.0
}

/**
 * PDF EXPORT UTILITY
 * 
 * Generates a PDF from the story pages.
 * Portrait orientation, book-like ratio.
 */

export async function exportStoryToPdf(
  pages: ComicFace[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    title = 'Mi Cuento Mágico',
    author = 'NubeKids Stories',
    quality = 0.92,
  } = options;

  // Create PDF in portrait, A4-ish dimensions
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [210, 297], // A4
  });

  // Set metadata
  pdf.setProperties({
    title,
    author,
    creator: 'NubeKids Platform',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Add new page (except for first)
    if (i > 0) {
      pdf.addPage();
    }

    // Add image if exists
    if (page.imageUrl) {
      try {
        const imgData = await loadImageAsBase64(page.imageUrl);
        const imgHeight = contentWidth * 0.75; // 4:3 aspect ratio
        
        pdf.addImage(
          imgData,
          'JPEG',
          margin,
          margin,
          contentWidth,
          imgHeight,
          undefined,
          'MEDIUM'
        );

        // Add caption below image
        if (page.narrative?.caption) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'normal');
          
          const textY = margin + imgHeight + 10;
          const lines = pdf.splitTextToSize(page.narrative.caption, contentWidth);
          pdf.text(lines, margin, textY);
        }

        // Add dialogue if exists
        if (page.narrative?.dialogue) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'italic');
          
          const captionHeight = page.narrative?.caption 
            ? pdf.splitTextToSize(page.narrative.caption, contentWidth).length * 6 
            : 0;
          const dialogueY = margin + imgHeight + 15 + captionHeight;
          
          const dialogueLines = pdf.splitTextToSize(\"\"\, contentWidth);
          pdf.text(dialogueLines, margin, dialogueY);
        }
      } catch (error) {
        console.error(\Error loading image for page \:\, error);
      }
    }

    // Add page number
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      \\ / \\,
      pageWidth / 2,
      pageHeight - margin,
      { align: 'center' }
    );
  }

  // Download the PDF
  pdf.save(\\.pdf\);
}

/**
 * Load an image URL and convert to base64
 */
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    
    img.onerror = () => reject(new Error(\Failed to load image: \\));
    img.src = url;
  });
}
