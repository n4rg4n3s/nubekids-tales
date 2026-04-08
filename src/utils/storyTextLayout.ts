import type { AgeGroup } from '../types';

export interface StoryTextMetrics {
  captionWords: number;
  dialogueWords: number;
  totalWords: number;
  hasDialogue: boolean;
}

export interface WebTextLayout {
  paddingX: number;
  paddingY: number;
  pageNumberSize: number;
  pageNumberFontSize: number;
  pageNumberGap: number;
  captionFontSize: number;
  captionLineHeight: number;
  dialogueFontSize: number;
  dialogueLineHeight: number;
  dialogueGap: number;
  showDecoration: boolean;
  decorationFontSize: number;
  decorationGap: number;
  verticalAlign: 'center' | 'start';
}

export interface PdfTextLayout {
  horizontalInset: number;
  topInset: number;
  bottomInset: number;
  circleRadius: number;
  pageNumberFontSize: number;
  pageNumberGap: number;
  captionFontSize: number;
  captionLineHeight: number;
  dialogueFontSize: number;
  dialogueLineHeight: number;
  dialogueGap: number;
  showDecoration: boolean;
  decorationFontSize: number;
  decorationGap: number;
  verticalAlign: 'center' | 'start';
}

const WEB_LAYOUTS: Record<AgeGroup, WebTextLayout[]> = {
  baby: [
    {
      paddingX: 18,
      paddingY: 18,
      pageNumberSize: 34,
      pageNumberFontSize: 14,
      pageNumberGap: 12,
      captionFontSize: 18,
      captionLineHeight: 24,
      dialogueFontSize: 17,
      dialogueLineHeight: 23,
      dialogueGap: 8,
      showDecoration: true,
      decorationFontSize: 18,
      decorationGap: 10,
      verticalAlign: 'center',
    },
    {
      paddingX: 16,
      paddingY: 16,
      pageNumberSize: 30,
      pageNumberFontSize: 13,
      pageNumberGap: 10,
      captionFontSize: 17,
      captionLineHeight: 23,
      dialogueFontSize: 16,
      dialogueLineHeight: 22,
      dialogueGap: 8,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      paddingX: 14,
      paddingY: 14,
      pageNumberSize: 26,
      pageNumberFontSize: 12,
      pageNumberGap: 8,
      captionFontSize: 15.5,
      captionLineHeight: 21,
      dialogueFontSize: 14.5,
      dialogueLineHeight: 20,
      dialogueGap: 6,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'start',
    },
  ],
  tiny: [
    {
      paddingX: 18,
      paddingY: 18,
      pageNumberSize: 32,
      pageNumberFontSize: 13,
      pageNumberGap: 12,
      captionFontSize: 16.5,
      captionLineHeight: 22,
      dialogueFontSize: 15.5,
      dialogueLineHeight: 21,
      dialogueGap: 8,
      showDecoration: true,
      decorationFontSize: 17,
      decorationGap: 10,
      verticalAlign: 'center',
    },
    {
      paddingX: 16,
      paddingY: 16,
      pageNumberSize: 28,
      pageNumberFontSize: 12,
      pageNumberGap: 10,
      captionFontSize: 15,
      captionLineHeight: 20.5,
      dialogueFontSize: 14,
      dialogueLineHeight: 19.5,
      dialogueGap: 7,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      paddingX: 14,
      paddingY: 14,
      pageNumberSize: 24,
      pageNumberFontSize: 11,
      pageNumberGap: 8,
      captionFontSize: 14,
      captionLineHeight: 19,
      dialogueFontSize: 13,
      dialogueLineHeight: 18,
      dialogueGap: 6,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'start',
    },
  ],
  little: [
    {
      paddingX: 16,
      paddingY: 16,
      pageNumberSize: 28,
      pageNumberFontSize: 12,
      pageNumberGap: 10,
      captionFontSize: 15,
      captionLineHeight: 20.5,
      dialogueFontSize: 14,
      dialogueLineHeight: 19.5,
      dialogueGap: 7,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      paddingX: 14,
      paddingY: 14,
      pageNumberSize: 24,
      pageNumberFontSize: 11,
      pageNumberGap: 8,
      captionFontSize: 14,
      captionLineHeight: 19,
      dialogueFontSize: 13,
      dialogueLineHeight: 18,
      dialogueGap: 6,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      paddingX: 12,
      paddingY: 12,
      pageNumberSize: 22,
      pageNumberFontSize: 10,
      pageNumberGap: 6,
      captionFontSize: 13,
      captionLineHeight: 17.5,
      dialogueFontSize: 12.25,
      dialogueLineHeight: 17,
      dialogueGap: 5,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'start',
    },
  ],
  reader: [
    {
      paddingX: 14,
      paddingY: 14,
      pageNumberSize: 24,
      pageNumberFontSize: 11,
      pageNumberGap: 8,
      captionFontSize: 14,
      captionLineHeight: 19,
      dialogueFontSize: 13,
      dialogueLineHeight: 18,
      dialogueGap: 6,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      paddingX: 12,
      paddingY: 12,
      pageNumberSize: 22,
      pageNumberFontSize: 10,
      pageNumberGap: 6,
      captionFontSize: 13,
      captionLineHeight: 17.5,
      dialogueFontSize: 12.25,
      dialogueLineHeight: 17,
      dialogueGap: 5,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      paddingX: 10,
      paddingY: 10,
      pageNumberSize: 20,
      pageNumberFontSize: 9,
      pageNumberGap: 5,
      captionFontSize: 12,
      captionLineHeight: 16.5,
      dialogueFontSize: 11.25,
      dialogueLineHeight: 15.5,
      dialogueGap: 4,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'start',
    },
  ],
};

const PDF_LAYOUTS: Record<AgeGroup, PdfTextLayout[]> = {
  baby: [
    {
      horizontalInset: 14,
      topInset: 14,
      bottomInset: 14,
      circleRadius: 7,
      pageNumberFontSize: 12,
      pageNumberGap: 10,
      captionFontSize: 20,
      captionLineHeight: 9.8,
      dialogueFontSize: 18,
      dialogueLineHeight: 9,
      dialogueGap: 7,
      showDecoration: true,
      decorationFontSize: 14,
      decorationGap: 8,
      verticalAlign: 'center',
    },
    {
      horizontalInset: 12,
      topInset: 12,
      bottomInset: 12,
      circleRadius: 6.2,
      pageNumberFontSize: 11,
      pageNumberGap: 8,
      captionFontSize: 18,
      captionLineHeight: 8.8,
      dialogueFontSize: 16,
      dialogueLineHeight: 8,
      dialogueGap: 6,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      horizontalInset: 10,
      topInset: 10,
      bottomInset: 10,
      circleRadius: 5.4,
      pageNumberFontSize: 10,
      pageNumberGap: 6,
      captionFontSize: 16,
      captionLineHeight: 7.8,
      dialogueFontSize: 14,
      dialogueLineHeight: 7.2,
      dialogueGap: 5,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'start',
    },
  ],
  tiny: [
    {
      horizontalInset: 14,
      topInset: 14,
      bottomInset: 14,
      circleRadius: 6.8,
      pageNumberFontSize: 12,
      pageNumberGap: 10,
      captionFontSize: 18,
      captionLineHeight: 8.8,
      dialogueFontSize: 16,
      dialogueLineHeight: 8,
      dialogueGap: 6,
      showDecoration: true,
      decorationFontSize: 14,
      decorationGap: 8,
      verticalAlign: 'center',
    },
    {
      horizontalInset: 12,
      topInset: 12,
      bottomInset: 12,
      circleRadius: 6,
      pageNumberFontSize: 11,
      pageNumberGap: 8,
      captionFontSize: 16.5,
      captionLineHeight: 8,
      dialogueFontSize: 14.5,
      dialogueLineHeight: 7.4,
      dialogueGap: 5,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      horizontalInset: 10,
      topInset: 10,
      bottomInset: 10,
      circleRadius: 5.2,
      pageNumberFontSize: 10,
      pageNumberGap: 6,
      captionFontSize: 15,
      captionLineHeight: 7.2,
      dialogueFontSize: 13.5,
      dialogueLineHeight: 6.8,
      dialogueGap: 5,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'start',
    },
  ],
  little: [
    {
      horizontalInset: 12,
      topInset: 12,
      bottomInset: 12,
      circleRadius: 6,
      pageNumberFontSize: 11,
      pageNumberGap: 8,
      captionFontSize: 16,
      captionLineHeight: 7.7,
      dialogueFontSize: 14,
      dialogueLineHeight: 7,
      dialogueGap: 5,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      horizontalInset: 10,
      topInset: 10,
      bottomInset: 10,
      circleRadius: 5.4,
      pageNumberFontSize: 10,
      pageNumberGap: 6,
      captionFontSize: 14.5,
      captionLineHeight: 7,
      dialogueFontSize: 13,
      dialogueLineHeight: 6.4,
      dialogueGap: 4,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      horizontalInset: 8,
      topInset: 8,
      bottomInset: 8,
      circleRadius: 4.8,
      pageNumberFontSize: 9,
      pageNumberGap: 5,
      captionFontSize: 13.5,
      captionLineHeight: 6.4,
      dialogueFontSize: 12,
      dialogueLineHeight: 5.9,
      dialogueGap: 4,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'start',
    },
  ],
  reader: [
    {
      horizontalInset: 10,
      topInset: 10,
      bottomInset: 10,
      circleRadius: 5.2,
      pageNumberFontSize: 10,
      pageNumberGap: 6,
      captionFontSize: 14.5,
      captionLineHeight: 6.9,
      dialogueFontSize: 13,
      dialogueLineHeight: 6.3,
      dialogueGap: 4,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      horizontalInset: 8,
      topInset: 8,
      bottomInset: 8,
      circleRadius: 4.8,
      pageNumberFontSize: 9,
      pageNumberGap: 5,
      captionFontSize: 13.25,
      captionLineHeight: 6.3,
      dialogueFontSize: 11.75,
      dialogueLineHeight: 5.8,
      dialogueGap: 4,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'center',
    },
    {
      horizontalInset: 7,
      topInset: 7,
      bottomInset: 7,
      circleRadius: 4.2,
      pageNumberFontSize: 8,
      pageNumberGap: 4,
      captionFontSize: 12.4,
      captionLineHeight: 5.8,
      dialogueFontSize: 11,
      dialogueLineHeight: 5.3,
      dialogueGap: 3.5,
      showDecoration: false,
      decorationFontSize: 0,
      decorationGap: 0,
      verticalAlign: 'start',
    },
  ],
};

export function getStoryTextMetrics(caption: string, dialogue: string): StoryTextMetrics {
  const captionWords = countWords(caption);
  const dialogueWords = countWords(dialogue);

  return {
    captionWords,
    dialogueWords,
    totalWords: captionWords + dialogueWords,
    hasDialogue: dialogueWords > 0,
  };
}

export function getWebTextLayouts(
  ageGroup: AgeGroup,
  metrics: StoryTextMetrics,
  isImmersiveMobile: boolean
): WebTextLayout[] {
  const denseBoost = metrics.totalWords >= 85 ? 1 : 0;
  const sizeReduction = (isImmersiveMobile ? 1 : 0) + denseBoost * 0.25;

  return WEB_LAYOUTS[ageGroup].map((layout, index) => {
    return {
      ...layout,
      paddingX: Math.max(8, layout.paddingX - (isImmersiveMobile ? 2 : 0) - index * denseBoost),
      paddingY: Math.max(8, layout.paddingY - (isImmersiveMobile ? 2 : 0) - index * denseBoost),
      pageNumberSize: Math.max(18, layout.pageNumberSize - (isImmersiveMobile ? 4 : 0)),
      pageNumberFontSize: Math.max(8, layout.pageNumberFontSize - (isImmersiveMobile ? 1 : 0)),
      pageNumberGap: Math.max(4, layout.pageNumberGap - (isImmersiveMobile ? 2 : 0)),
      captionFontSize: Math.max(11, layout.captionFontSize - sizeReduction),
      captionLineHeight: Math.max(15, layout.captionLineHeight - sizeReduction * 1.5),
      dialogueFontSize: Math.max(10.5, layout.dialogueFontSize - sizeReduction),
      dialogueLineHeight: Math.max(14, layout.dialogueLineHeight - sizeReduction * 1.4),
      dialogueGap: Math.max(3, layout.dialogueGap - (isImmersiveMobile ? 1 : 0)),
      decorationFontSize: Math.max(0, layout.decorationFontSize - (isImmersiveMobile ? 2 : 0)),
      decorationGap: Math.max(0, layout.decorationGap - (isImmersiveMobile ? 2 : 0)),
    };
  });
}

export function getPdfTextLayouts(ageGroup: AgeGroup, metrics: StoryTextMetrics): PdfTextLayout[] {
  const denseBoost = metrics.totalWords >= 85 ? 0.6 : 0;

  return PDF_LAYOUTS[ageGroup].map((layout, index) => ({
    ...layout,
    horizontalInset: Math.max(6, layout.horizontalInset - denseBoost * index),
    captionFontSize: Math.max(11.5, layout.captionFontSize - denseBoost),
    captionLineHeight: Math.max(5.4, layout.captionLineHeight - denseBoost * 0.35),
    dialogueFontSize: Math.max(10.5, layout.dialogueFontSize - denseBoost),
    dialogueLineHeight: Math.max(5, layout.dialogueLineHeight - denseBoost * 0.3),
  }));
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
