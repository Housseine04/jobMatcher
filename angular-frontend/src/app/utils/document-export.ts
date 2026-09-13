/**
 * Utility for exporting cover letters as formatted .txt and professional .pdf files.
 */

export interface StructuredCoverLetterData {
  candidateName: string;
  candidateTitle: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateLocation: string;
  candidateLinkedin: string;
  companyName: string;
  companyManager: string;
  companyLocation: string;
  letterDate: string;
  body: string;
  language?: 'en' | 'fr';
}

// Mapping of unicode characters to WinAnsi octal escape codes for standard PDF fonts
const WIN_ANSI_MAP: Record<string, string> = {
  'é': '\\351', 'è': '\\350', 'ê': '\\352', 'ë': '\\353',
  'à': '\\340', 'â': '\\342', 'ä': '\\344',
  'ç': '\\347',
  'î': '\\356', 'ï': '\\357',
  'ô': '\\364', 'ö': '\\366',
  'ù': '\\371', 'û': '\\373', 'ü': '\\374',
  'ÿ': '\\377',
  'É': '\\311', 'È': '\\310', 'Ê': '\\312', 'Ë': '\\313',
  'À': '\\300', 'Â': '\\302', 'Ä': '\\304',
  'Ç': '\\307',
  'Î': '\\316', 'Ï': '\\317',
  'Ô': '\\324', 'Ö': '\\326',
  'Ù': '\\331', 'Û': '\\333', 'Ü': '\\334',
  'œ': '\\234', 'Œ': '\\214',
  '’': '\\222', '‘': '\\221', '“': '\\223', '”': '\\224',
  '«': '\\253', '»': '\\273',
  '–': '\\226', '—': '\\227', '…': '\\205',
  '°': '\\260', '€': '\\200',
  '\u2011': '-',
  '\u00AD': '-',
  '\u00A0': ' ',
  '\u202F': ' '
};

/**
 * Escapes a plain text line into a PDF string supporting WinAnsiEncoding (French accents & quotes).
 */
function escapePdfText(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '\\') {
      result += '\\\\';
    } else if (char === '(') {
      result += '\\(';
    } else if (char === ')') {
      result += '\\)';
    } else if (WIN_ANSI_MAP[char]) {
      result += WIN_ANSI_MAP[char];
    } else {
      const code = char.charCodeAt(0);
      if (code >= 32 && code <= 126) {
        result += char;
      } else if (code >= 160 && code <= 255) {
        result += '\\' + code.toString(8).padStart(3, '0');
      } else {
        const normalized = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        result += (normalized && normalized.charCodeAt(0) <= 126) ? normalized : ' ';
      }
    }
  }
  return result;
}

/**
 * Wraps a long line into multiple lines fitting within maxChars.
 */
// Standard Helvetica AFM character widths (in 1/1000 of font size)
const HELVETICA_CHAR_WIDTHS: Record<number, number> = {
  32: 278, // space
  33: 278, 34: 355, 35: 556, 36: 556, 37: 889, 38: 667, 39: 191,
  40: 333, 41: 333, 42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278,
  48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556, 56: 556, 57: 556, // 0-9
  58: 278, 59: 278, 60: 584, 61: 584, 62: 584, 63: 556, 64: 1015,
  65: 667, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778, 72: 722, 73: 278, 74: 500, // A-J
  75: 667, 76: 556, 77: 833, 78: 722, 79: 778, 80: 667, 81: 778, 82: 722, 83: 667, 84: 611, // K-T
  85: 722, 86: 667, 87: 944, 88: 667, 89: 667, 90: 611, // U-Z
  91: 278, 92: 278, 93: 278, 94: 469, 95: 556, 96: 222,
  97: 556, 98: 556, 99: 500, 100: 556, 101: 556, 102: 278, 103: 556, 104: 556, 105: 222, 106: 222, // a-j
  107: 500, 108: 222, 109: 833, 110: 556, 111: 556, 112: 556, 113: 556, 114: 333, 115: 500, 116: 278, // k-t
  117: 556, 118: 500, 119: 722, 120: 500, 121: 500, 122: 500, // u-z
  123: 334, 124: 260, 125: 334, 126: 584
};

const HELVETICA_SPECIAL_WIDTHS: Record<string, number> = {
  'é': 556, 'è': 556, 'ê': 556, 'ë': 556,
  'à': 556, 'â': 556, 'ä': 556,
  'ç': 500,
  'î': 222, 'ï': 222,
  'ô': 556, 'ö': 556,
  'ù': 556, 'û': 556, 'ü': 556,
  'ÿ': 500,
  'É': 667, 'È': 667, 'Ê': 667, 'Ë': 667,
  'À': 667, 'Â': 667, 'Ä': 667,
  'Ç': 722,
  'Î': 278, 'Ï': 278,
  'Ô': 778, 'Ö': 778,
  'Ù': 722, 'Û': 722, 'Ü': 722,
  'œ': 889, 'Œ': 1000,
  '’': 222, '‘': 222, '“': 333, '”': 333,
  '«': 500, '»': 500,
  '–': 556, '—': 1000, '…': 1000,
  '°': 400, '€': 556
};

function getCharWidth(char: string): number {
  if (HELVETICA_SPECIAL_WIDTHS[char] !== undefined) {
    return HELVETICA_SPECIAL_WIDTHS[char];
  }
  const code = char.charCodeAt(0);
  if (HELVETICA_CHAR_WIDTHS[code] !== undefined) {
    return HELVETICA_CHAR_WIDTHS[code];
  }
  return 556;
}

function getTextWidth(text: string, fontSize: number): number {
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    total += getCharWidth(text[i]);
  }
  return (total * fontSize) / 1000;
}

/**
 * Wraps text into lines that fit within maxWidth (in PDF points) for a given font size.
 */
function wrapTextToWidth(text: string, maxWidth: number, fontSize: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Normalize non-breaking hyphens and spaces
  const clean = trimmed.replace(/\u2011/g, '-').replace(/[\u00A0\u202F]/g, ' ');
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      if (getTextWidth(word, fontSize) <= maxWidth) {
        currentLine = word;
      } else {
        // Fallback for unusually long unbroken strings (e.g. long URLs)
        let chunk = '';
        for (const ch of word) {
          if (getTextWidth(chunk + ch, fontSize) <= maxWidth) {
            chunk += ch;
          } else {
            lines.push(chunk);
            chunk = ch;
          }
        }
        currentLine = chunk;
      }
    } else {
      const candidate = currentLine + ' ' + word;
      if (getTextWidth(candidate, fontSize) <= maxWidth) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

interface PdfBodyLine {
  type: 'text' | 'empty';
  text?: string;
  isBold?: boolean;
}

/**
 * Converts the raw textarea text into printable lines, preserving all user-typed blank lines and line breaks.
 */
function parseBodyToPrintableLines(
  rawBody: string,
  maxWidth: number,
  fontSize: number,
  candidateName: string
): PdfBodyLine[] {
  const normalized = rawBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');

  // Strip empty lines only from the extreme top and bottom of the text,
  // while preserving all user-typed blank lines inside the body
  let startIdx = 0;
  while (startIdx < rawLines.length && rawLines[startIdx].trim() === '') {
    startIdx++;
  }
  let endIdx = rawLines.length - 1;
  while (endIdx >= startIdx && rawLines[endIdx].trim() === '') {
    endIdx--;
  }

  if (startIdx > endIdx) {
    return [];
  }

  const trimmedLines = rawLines.slice(startIdx, endIdx + 1);

  // Identify valediction line to detect signature name following it
  const valedictionRegex = /^(sincerely|best regards|warm regards|kind regards|yours sincerely|cordialement|bien cordialement|bien [àa] vous|respectueusement|avec mes salutations)/i;

  let valedictionLineIdx = -1;
  for (let i = trimmedLines.length - 1; i >= 0; i--) {
    if (trimmedLines[i].trim() && valedictionRegex.test(trimmedLines[i].trim())) {
      valedictionLineIdx = i;
      break;
    }
  }

  const result: PdfBodyLine[] = [];

  for (let i = 0; i < trimmedLines.length; i++) {
    const rawLine = trimmedLines[i];
    const trimmed = rawLine.trim();

    if (trimmed === '') {
      // User entered an empty line in the textarea
      result.push({ type: 'empty' });
    } else {
      const isSignature = Boolean(
        (valedictionLineIdx !== -1 && i > valedictionLineIdx) ||
        (candidateName && trimmed.toLowerCase() === candidateName.trim().toLowerCase())
      );

      const wrapped = wrapTextToWidth(rawLine, maxWidth, fontSize);
      for (const w of wrapped) {
        result.push({
          type: 'text',
          text: w,
          isBold: isSignature
        });
      }
    }
  }

  return result;
}

/**
 * Exports text as a .txt file and triggers browser download.
 */
export function exportAsTxt(content: string, filename = 'Cover_Letter.txt'): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, filename);
}

/**
 * Generates a professionally formatted formal Letterhead A4 PDF (Novoresume structure).
 * Eliminates empty margins and centers content vertically with balanced conventional paddings.
 */
export function exportStructuredPdf(data: StructuredCoverLetterData, filename = 'Cover_Letter.pdf'): void {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 48; // Professional conventional A4 margin (~17mm)
  const printableWidth = pageWidth - (2 * marginX); // 499.28 pt
  const bodyMaxWidth = printableWidth - 4; // 495.28 pt, maximum usable width

  const baseMarginTop = 48;
  const baseMarginBottom = 48;
  const usableHeight = pageHeight - baseMarginTop - baseMarginBottom; // 745.89 pt

  const isFrench = data.language === 'fr';

  // Base typography & spacing tokens
  const bodyFontSize = 10.5;
  const lineHeight = 16.5;
  const gapHeaderToRecipient = 18;

  // 1. Prepare Header Content
  const name = data.candidateName.trim() || (isFrench ? 'Prénom Nom' : 'Candidate Name');
  const title = data.candidateTitle.trim() || (isFrench ? 'Professionnel' : 'Professional');

  const contacts: string[] = [];
  if (data.candidateEmail.trim()) contacts.push(data.candidateEmail.trim());
  if (data.candidatePhone.trim()) contacts.push(data.candidatePhone.trim());
  if (data.candidateLocation.trim()) contacts.push(data.candidateLocation.trim());
  if (data.candidateLinkedin.trim()) contacts.push(data.candidateLinkedin.trim());

  // Fixed header vertical span
  const headerSpan = 48;

  // 2. Prepare Recipient Content
  const recipientLabel = isFrench ? "À l'attention de :" : "To:";
  const recipientItems: { font: string; size: number; color: string; text: string; offset: number }[] = [];
  recipientItems.push({ font: '/F1', size: 8, color: '0.55 0.58 0.62 rg', text: recipientLabel, offset: 0 });

  if (data.companyName.trim()) {
    recipientItems.push({ font: '/F2', size: 10, color: '0.15 0.18 0.22 rg', text: data.companyName.trim(), offset: -13 });
  }
  if (data.companyManager.trim()) {
    recipientItems.push({ font: '/F1', size: 9, color: '0.35 0.38 0.42 rg', text: data.companyManager.trim(), offset: -12 });
  }
  if (data.companyLocation.trim()) {
    recipientItems.push({ font: '/F1', size: 9, color: '0.35 0.38 0.42 rg', text: data.companyLocation.trim(), offset: -12 });
  }

  const defaultDate = new Date().toLocaleDateString(isFrench ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const letterDate = data.letterDate.trim() || defaultDate;
  recipientItems.push({ font: '/F3', size: 8.5, color: '0.45 0.48 0.52 rg', text: letterDate, offset: -13 });

  let recipientSpan = 0;
  for (let i = 1; i < recipientItems.length; i++) {
    recipientSpan += Math.abs(recipientItems[i].offset);
  }

  // 3. Parse Body Lines (preserving exact textarea formatting and blank lines)
  const bodyLines = parseBodyToPrintableLines(data.body, bodyMaxWidth, bodyFontSize, data.candidateName);

  // Exact height consumed by body text lines and blank lines:
  const bodyContentHeight = bodyLines.length * lineHeight;

  // Header & Recipient end Y coordinate (cleanly anchored at top of page):
  const marginTop = baseMarginTop;
  const headerTopY = pageHeight - marginTop;
  const dividerY = headerTopY - headerSpan;
  const recipientStartY = dividerY - gapHeaderToRecipient;
  const recipientEndY = recipientStartY - recipientSpan;

  // Space available below recipient down to bottom margin:
  const availableSpaceBelowRecipient = recipientEndY - baseMarginBottom;

  // Slack: the entire blank space that would be left at the end of the file
  const slack = availableSpaceBelowRecipient - bodyContentHeight;

  // Vertical Centering: Split the blank space 50/50:
  // - Half the blank space goes between recipient coordinates and the body
  // - The other half remains at the end of the file below the body!
  let gapRecipientToBody = 24;
  if (slack > 0) {
    const halfBlank = Math.floor(slack / 2);
    gapRecipientToBody = Math.max(24, halfBlank);
  }

  // 5. Build Content Streams (supporting single or multi-page)
  const pageStreams: string[] = [];

  // --- Page 1 Stream Construction ---
  let p1Stream = '';

  // Header Left: Candidate Name & Title
  p1Stream += `BT\n`;
  p1Stream += `/F2 18 Tf\n`;
  p1Stream += `0.12 0.23 0.54 rg\n`; // Deep Navy
  p1Stream += `${marginX} ${(headerTopY - 16).toFixed(2)} Td\n`;
  p1Stream += `(${escapePdfText(name)}) Tj\n`;
  p1Stream += `0.15 0.39 0.92 rg\n`; // Royal Blue
  p1Stream += `/F1 10.5 Tf\n`;
  p1Stream += `0 -18 Td\n`;
  p1Stream += `(${escapePdfText(title)}) Tj\n`;
  p1Stream += `ET\n`;

  // Header Right: Candidate Contacts (Clean flush right alignment)
  if (contacts.length > 0) {
    for (let i = 0; i < contacts.length; i++) {
      const contactText = contacts[i];
      const itemW = getTextWidth(contactText, 8.5);
      const itemX = (pageWidth - marginX) - itemW;
      const itemY = headerTopY - 10 - (i * 12.5);

      p1Stream += `BT\n`;
      p1Stream += `/F1 8.5 Tf\n`;
      p1Stream += `0.35 0.38 0.42 rg\n`; // Slate gray
      p1Stream += `${itemX.toFixed(2)} ${itemY.toFixed(2)} Td\n`;
      p1Stream += `(${escapePdfText(contactText)}) Tj\n`;
      p1Stream += `ET\n`;
    }
  }

  // Divider Line spanning full margin width
  p1Stream += `q\n0.85 0.88 0.92 RG\n0.75 w\n${marginX} ${dividerY.toFixed(2)} m ${(pageWidth - marginX).toFixed(2)} ${dividerY.toFixed(2)} l S\nQ\n`;

  // Recipient Box
  p1Stream += `BT\n`;
  let currRecY = recipientStartY;
  p1Stream += `${recipientItems[0].font} ${recipientItems[0].size} Tf\n`;
  p1Stream += `${recipientItems[0].color}\n`;
  p1Stream += `${marginX} ${currRecY.toFixed(2)} Td\n`;
  p1Stream += `(${escapePdfText(recipientItems[0].text)}) Tj\n`;

  for (let i = 1; i < recipientItems.length; i++) {
    const item = recipientItems[i];
    currRecY += item.offset;
    p1Stream += `0 ${item.offset} Td\n`;
    p1Stream += `${item.font} ${item.size} Tf\n`;
    p1Stream += `${item.color}\n`;
    p1Stream += `(${escapePdfText(item.text)}) Tj\n`;
  }
  p1Stream += `ET\n`;

  // 6. Layout Body Lines (exact visual match to the textarea)
  let currentY = currRecY - gapRecipientToBody;
  let currentPageStream = p1Stream;
  let currentPageIndex = 0;

  for (let idx = 0; idx < bodyLines.length; idx++) {
    const item = bodyLines[idx];

    // Check if we need to paginate onto next page
    if (currentY - lineHeight < baseMarginBottom && currentPageIndex === 0 && idx < bodyLines.length - 2) {
      pageStreams.push(currentPageStream);
      currentPageIndex = 1;
      currentPageStream = '';
      currentY = pageHeight - baseMarginTop - 20;
    }

    if (item.type === 'empty') {
      currentY -= lineHeight;
    } else if (item.type === 'text' && item.text) {
      const font = item.isBold ? '/F2' : '/F1';
      const color = '0.15 0.17 0.20 rg'; // Dark charcoal

      currentPageStream += `BT\n`;
      currentPageStream += `${font} ${bodyFontSize} Tf\n`;
      currentPageStream += `${color}\n`;
      currentPageStream += `${marginX} ${currentY.toFixed(2)} Td\n`;
      currentPageStream += `(${escapePdfText(item.text)}) Tj\n`;
      currentPageStream += `ET\n`;

      currentY -= lineHeight;
    }
  }

  pageStreams.push(currentPageStream);

  const totalPages = pageStreams.length;

  // Add subtle page numbers if multi-page
  if (totalPages > 1) {
    for (let p = 0; p < totalPages; p++) {
      pageStreams[p] += `BT\n/F1 8 Tf\n0.6 0.6 0.6 rg\n`;
      pageStreams[p] += `${(pageWidth - marginX - 45).toFixed(2)} ${(baseMarginBottom - 18).toFixed(2)} Td\n`;
      pageStreams[p] += `(Page ${p + 1} / ${totalPages}) Tj\nET\n`;
    }
  }

  // Compile and trigger PDF download
  buildCompliantPdf(totalPages, pageStreams, pageWidth, pageHeight, filename);
}

/**
 * Compiles and triggers download for the compliant multi-font PDF.
 */
function buildCompliantPdf(
  totalPages: number,
  pageStreams: string[],
  pageWidth: number,
  pageHeight: number,
  filename: string
): void {
  const objects: string[] = [];
  const pageObjIndices: number[] = [];

  // Objects 1: Catalog, 2: Pages, 3: Font F1, 4: Font F2, 5: Font F3
  objects[0] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  objects[2] = `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`;
  objects[3] = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`;
  objects[4] = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj\n`;

  for (let p = 0; p < totalPages; p++) {
    const pageObjNum = 6 + p * 2;
    const streamObjNum = pageObjNum + 1;
    pageObjIndices.push(pageObjNum);

    const streamBytes = new TextEncoder().encode(pageStreams[p]);
    const pageObj = `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${streamObjNum} 0 R >>\nendobj\n`;
    const streamObj = `${streamObjNum} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${pageStreams[p]}endstream\nendobj\n`;

    objects[pageObjNum - 1] = pageObj;
    objects[streamObjNum - 1] = streamObj;
  }

  // Pages Object (Obj 2)
  const kidsStr = pageObjIndices.map(i => `${i} 0 R`).join(' ');
  objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>\nendobj\n`;

  // Assemble file
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += objects[i];
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (const offset of offsets) {
    pdf += offset.toString().padStart(10, '0') + ' 00000 n \n';
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF\n`;

  const blob = new Blob([new TextEncoder().encode(pdf)], { type: 'application/pdf' });
  triggerDownload(blob, filename);
}

/**
 * Helper to trigger browser file download.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
