import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { CardData } from '../types/card';

export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf';
  scale?: number;
  quality?: number;
  filename?: string;
  bleedMarginMm?: number;
  showCropMarks?: boolean;
}

export interface SheetOptions {
  paperSize: 'a4' | 'letter';
  grid: '2x4' | '3x3' | '2x5' | 'custom';
  rows: number;
  cols: number;
  marginMm: number;
  cardGapMm: number;
  includeCutLines: boolean;
  filename?: string;
}

// 2D Canvas context for browser-native conversion of any CSS color (including oklch, lab, color())
let helperCanvasCtx: CanvasRenderingContext2D | null = null;

function getHelperCanvasCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!helperCanvasCtx) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    helperCanvasCtx = canvas.getContext('2d', { willReadFrequently: true });
  }
  return helperCanvasCtx;
}

/**
 * Converts any CSS color (including modern oklch, oklab, lab, lch, color(...))
 * into a standard #rrggbb, rgb(...), or rgba(...) string supported by html2canvas.
 */
export function convertColorToStandardRgb(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  const trimmed = colorStr.trim();
  if (
    trimmed === 'transparent' ||
    trimmed === 'inherit' ||
    trimmed === 'initial' ||
    trimmed === 'unset' ||
    trimmed === 'currentColor' ||
    trimmed === ''
  ) {
    return trimmed;
  }

  // Check if string contains modern color function
  if (
    trimmed.includes('oklch') ||
    trimmed.includes('oklab') ||
    trimmed.includes('lab(') ||
    trimmed.includes('lch(') ||
    trimmed.includes('color(')
  ) {
    const ctx = getHelperCanvasCtx();
    if (ctx) {
      try {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#000000';
        ctx.fillStyle = trimmed;
        ctx.fillRect(0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        const alpha = data[3] / 255;
        if (alpha >= 0.999) {
          return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
        }
        return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${alpha.toFixed(3)})`;
      } catch {
        // Fallback
      }
    }
    return '#0f172a';
  }

  return trimmed;
}

/**
 * Replaces any oklch(...) or other unsupported color functions in a CSS string or gradient.
 */
export function normalizeCssColorString(cssText: string): string {
  if (!cssText || typeof cssText !== 'string') return cssText;
  if (
    !cssText.includes('oklch') &&
    !cssText.includes('oklab') &&
    !cssText.includes('lab(') &&
    !cssText.includes('lch(') &&
    !cssText.includes('color(')
  ) {
    return cssText;
  }

  return cssText.replace(/(?:oklch|oklab|lab|lch|color)\([^)]+\)/gi, (match) => {
    return convertColorToStandardRgb(match);
  });
}

/**
 * Deeply normalizes all computed and inline styles of a DOM tree
 * so html2canvas never encounters unsupported CSS color functions.
 */
function sanitizeClonedDomForExport(clonedDoc: Document, clonedTarget: HTMLElement): void {
  // 1. Sanitize all <style> elements in cloned document head/body
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((tag) => {
    if (tag.textContent) {
      tag.textContent = normalizeCssColorString(tag.textContent);
    }
  });

  // 2. Sanitize all style attributes and inline styles of all elements in clonedTarget
  const allElements = [clonedTarget, ...Array.from(clonedTarget.querySelectorAll('*'))] as HTMLElement[];

  allElements.forEach((el) => {
    try {
      const computed = window.getComputedStyle(el);

      // Color
      if (computed.color) {
        el.style.color = convertColorToStandardRgb(computed.color);
      }
      // Background Color
      if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        el.style.backgroundColor = convertColorToStandardRgb(computed.backgroundColor);
      }
      // Border Colors
      if (computed.borderTopColor) el.style.borderTopColor = convertColorToStandardRgb(computed.borderTopColor);
      if (computed.borderRightColor) el.style.borderRightColor = convertColorToStandardRgb(computed.borderRightColor);
      if (computed.borderBottomColor) el.style.borderBottomColor = convertColorToStandardRgb(computed.borderBottomColor);
      if (computed.borderLeftColor) el.style.borderLeftColor = convertColorToStandardRgb(computed.borderLeftColor);
      if (computed.outlineColor) el.style.outlineColor = convertColorToStandardRgb(computed.outlineColor);

      // Box shadow & Background image (gradients)
      if (computed.boxShadow && computed.boxShadow !== 'none') {
        el.style.boxShadow = normalizeCssColorString(computed.boxShadow);
      }
      if (computed.backgroundImage && computed.backgroundImage !== 'none') {
        el.style.backgroundImage = normalizeCssColorString(computed.backgroundImage);
      }

      // Fill & Stroke for SVG elements
      if (el.hasAttribute('fill')) {
        const fill = el.getAttribute('fill');
        if (fill) el.setAttribute('fill', convertColorToStandardRgb(fill));
      }
      if (el.hasAttribute('stroke')) {
        const stroke = el.getAttribute('stroke');
        if (stroke) el.setAttribute('stroke', convertColorToStandardRgb(stroke));
      }
    } catch {
      // Skip if element detached
    }

    // Set crossOrigin on any image tags
    if (el.tagName.toLowerCase() === 'img') {
      const img = el as HTMLImageElement;
      img.crossOrigin = 'anonymous';
    }
  });
}

/**
 * Exports a Card HTML element to a high-resolution canvas data URL.
 */
export async function exportCardElementAsImage(
  element: HTMLElement,
  options: ExportOptions
): Promise<string> {
  const scale = options.scale || 3.5; // 3.5x for crisp 300+ DPI

  // Wait for web fonts to finish loading
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: options.format === 'jpg' ? '#ffffff' : null,
    logging: false,
    imageTimeout: 15000,
    onclone: (clonedDoc, clonedElement) => {
      sanitizeClonedDomForExport(clonedDoc, clonedElement);
    },
  });

  const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
  const quality = options.quality !== undefined ? options.quality : 0.98;
  return canvas.toDataURL(mimeType, quality);
}

/**
 * Downloads a single card credential in PNG, JPG, or professional-grade PDF format.
 */
export async function downloadCardSingle(
  element: HTMLElement,
  card: CardData,
  options: ExportOptions
): Promise<void> {
  const safePersonName = (card.personName || 'Cardholder').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeId = (card.id || 'card').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = options.filename || `${safeId}-${safePersonName}`;

  if (options.format === 'pdf') {
    // Generate ultra high-DPI image capture
    const dataUrl = await exportCardElementAsImage(element, { ...options, format: 'png', scale: 3.5 });

    // Standard CR80 is 85.6mm x 53.98mm
    const isLandscape = card.orientation === 'horizontal';
    const rawCardWidthMm = isLandscape ? 85.6 : 53.98;
    const rawCardHeightMm = isLandscape ? 53.98 : 85.6;

    const showCropMarks = options.showCropMarks ?? false;
    const bleedMarginMm = options.bleedMarginMm ?? 0;

    // If crop marks or bleed requested, expand page to house margin and cut indicators
    const marginOffsetMm = showCropMarks ? 5 : 0;
    const pageCardWidth = rawCardWidthMm + bleedMarginMm * 2;
    const pageCardHeight = rawCardHeightMm + bleedMarginMm * 2;
    const pageWidthMm = pageCardWidth + marginOffsetMm * 2;
    const pageHeightMm = pageCardHeight + marginOffsetMm * 2;

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
    });

    // Embed professional PDF Document metadata
    pdf.setProperties({
      title: `${card.name} — ${card.personName}`,
      subject: `ID Card Credential (${card.id})`,
      author: card.organizationName || 'ID Maker Pro',
      keywords: 'ID Card, Credential, CR80, Professional Print, Security Badge',
      creator: 'ID Maker Studio',
    });

    const imgX = marginOffsetMm;
    const imgY = marginOffsetMm;

    pdf.addImage(dataUrl, 'PNG', imgX, imgY, pageCardWidth, pageCardHeight, undefined, 'FAST');

    // Draw professional hairline crop/cut marks if enabled
    if (showCropMarks) {
      pdf.setDrawColor(100, 116, 139);
      pdf.setLineWidth(0.15);

      const trimX1 = marginOffsetMm + bleedMarginMm;
      const trimX2 = trimX1 + rawCardWidthMm;
      const trimY1 = marginOffsetMm + bleedMarginMm;
      const trimY2 = trimY1 + rawCardHeightMm;

      // Top-Left crop marks
      pdf.line(trimX1, 0.5, trimX1, trimY1 - 1);
      pdf.line(0.5, trimY1, trimX1 - 1, trimY1);

      // Top-Right crop marks
      pdf.line(trimX2, 0.5, trimX2, trimY1 - 1);
      pdf.line(trimX2 + 1, trimY1, pageWidthMm - 0.5, trimY1);

      // Bottom-Left crop marks
      pdf.line(trimX1, trimY2 + 1, trimX1, pageHeightMm - 0.5);
      pdf.line(0.5, trimY2, trimX1 - 1, trimY2);

      // Bottom-Right crop marks
      pdf.line(trimX2, trimY2 + 1, trimX2, pageHeightMm - 0.5);
      pdf.line(trimX2 + 1, trimY2, pageWidthMm - 0.5, trimY2);
    }

    pdf.save(`${filename}.pdf`);
  } else {
    const dataUrl = await exportCardElementAsImage(element, options);
    const link = document.createElement('a');
    link.download = `${filename}.${options.format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Exports multiple card elements as a merged multi-page PDF document (1 card per page).
 */
export async function downloadMultipleCardsMergedPdf(
  cardElements: HTMLElement[],
  cards: CardData[],
  options?: { filename?: string; showCropMarks?: boolean }
): Promise<void> {
  if (cardElements.length === 0) return;

  const isLandscape = cards[0]?.orientation === 'horizontal';
  const cardWidthMm = isLandscape ? 85.6 : 53.98;
  const cardHeightMm = isLandscape ? 53.98 : 85.6;

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [cardWidthMm, cardHeightMm],
  });

  pdf.setProperties({
    title: `ID Maker Batch Export — ${cards.length} Cards`,
    subject: 'Batch Credential Cards',
    author: 'ID Maker Pro Studio',
    creator: 'ID Maker Studio',
  });

  for (let i = 0; i < cardElements.length; i++) {
    if (i > 0) {
      pdf.addPage([cardWidthMm, cardHeightMm], isLandscape ? 'landscape' : 'portrait');
    }
    const dataUrl = await exportCardElementAsImage(cardElements[i], { format: 'png', scale: 3.5 });
    pdf.addImage(dataUrl, 'PNG', 0, 0, cardWidthMm, cardHeightMm, undefined, 'FAST');
  }

  const filename = options?.filename || `IDMaker-Batch-${cards.length}-Cards.pdf`;
  pdf.save(filename);
}

/**
 * Arranges multiple cards on an A4 or US Letter sheet with optional cut lines and margin guides.
 */
export async function generatePrintableSheetPdf(
  cardElements: HTMLElement[],
  cards: CardData[],
  options: SheetOptions
): Promise<void> {
  const isA4 = options.paperSize === 'a4';
  const sheetWidthMm = isA4 ? 210 : 215.9; // A4 vs Letter (mm)
  const sheetHeightMm = isA4 ? 297 : 279.4;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: options.paperSize,
  });

  pdf.setProperties({
    title: `ID Maker Print Sheet (${cards.length} Cards)`,
    subject: `Printable ${options.paperSize.toUpperCase()} Card Grid`,
    author: 'ID Maker Pro Studio',
    creator: 'ID Maker Studio',
  });

  const cardWidthMm = 85.6;
  const cardHeightMm = 53.98;

  let cols = options.cols;
  let rows = options.rows;

  if (options.grid === '2x4') {
    cols = 2;
    rows = 4;
  } else if (options.grid === '3x3') {
    cols = 3;
    rows = 3;
  } else if (options.grid === '2x5') {
    cols = 2;
    rows = 5;
  }

  const marginMm = options.marginMm || 10;
  const gapX = options.cardGapMm || 4;
  const gapY = options.cardGapMm || 4;

  // Calculate available space
  const totalUsableWidth = sheetWidthMm - marginMm * 2;
  const totalUsableHeight = sheetHeightMm - marginMm * 2;

  // Auto center grid on page
  const gridTotalWidth = cols * cardWidthMm + (cols - 1) * gapX;
  const gridTotalHeight = rows * cardHeightMm + (rows - 1) * gapY;
  const startX = marginMm + Math.max(0, (totalUsableWidth - gridTotalWidth) / 2);
  const startY = marginMm + Math.max(0, (totalUsableHeight - gridTotalHeight) / 2);

  // Capture all card elements into dataUrls with CSS color normalization
  const capturedImages: string[] = [];
  for (const el of cardElements) {
    const imgData = await exportCardElementAsImage(el, { format: 'png', scale: 3 });
    capturedImages.push(imgData);
  }

  let cardIndex = 0;
  let pageCount = 0;

  while (cardIndex < capturedImages.length) {
    if (pageCount > 0) {
      pdf.addPage();
    }
    pageCount++;

    // Draw header info on sheet
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `ID Maker Print Sheet — Page ${pageCount} • Generated ${new Date().toLocaleDateString()}`,
      marginMm,
      marginMm - 3
    );

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (cardIndex >= capturedImages.length) break;

        const posX = startX + c * (cardWidthMm + gapX);
        const posY = startY + r * (cardHeightMm + gapY);
        const img = capturedImages[cardIndex];

        pdf.addImage(img, 'PNG', posX, posY, cardWidthMm, cardHeightMm, undefined, 'FAST');

        // Draw light crop marks / cut lines if enabled
        if (options.includeCutLines) {
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.15);
          pdf.rect(posX, posY, cardWidthMm, cardHeightMm);
        }

        cardIndex++;
      }
    }
  }

  pdf.save(options.filename || `IDMaker-Print-Sheet-${cards.length}-Cards.pdf`);
}
