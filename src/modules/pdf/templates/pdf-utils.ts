import PDFDocument from 'pdfkit';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';

export interface ClinicInfo {
  name: string;
  rnc: string;
  address: string;
  phone: string;
}

export const DEFAULT_CLINIC: ClinicInfo = {
  name: 'Sociotech Clinic',
  rnc: 'XXX-XXXXXXX-X',
  address: '',
  phone: '',
};

const PRIMARY = '#1e3a5f';
const PRIMARY_LIGHT = '#2c5282';
const ACCENT = '#e2e8f0';
const TEXT_MUTED = '#718096';
const TEXT_DARK = '#1a202c';
const WHITE = '#ffffff';

const LOGO_DIR = join(process.cwd(), 'src', 'assets', 'logos');
const LOGO_HEADER = join(LOGO_DIR, 'LOGO_DOC_2_no_bg.png');
const LOGO_WATERMARK = join(LOGO_DIR, 'LOGO_DOC_1_no_bg.png');

// Cached black version of the header logo (all non-transparent pixels → pure black)
let headerLogoBuffer: Buffer | null = null;

function loadHeaderLogoBlack(): Buffer | null {
  try {
    const raw = readFileSync(LOGO_HEADER);
    const png = PNG.sync.read(raw);
    for (let i = 0; i < png.data.length; i += 4) {
      if (png.data[i + 3] > 10) {
        png.data[i] = 0;
        png.data[i + 1] = 0;
        png.data[i + 2] = 0;
      }
    }
    return PNG.sync.write(png);
  } catch {
    return null;
  }
}

export function createPdfDocument(
  title: string,
  clinic?: Partial<ClinicInfo>,
): PDFKit.PDFDocument {
  const info = { ...DEFAULT_CLINIC, ...clinic };
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
    info: { Title: title, Creator: 'Sociotech System' },
  });
  (doc as any).__clinicInfo = info;
  (doc as any).__pageW = doc.page.width;

  doc.on('pageAdded', () => {
    drawWatermark(doc);
  });

  // pageAdded doesn't fire for page 0 (created in constructor before listener),
  // so draw watermark explicitly here
  drawWatermark(doc);

  return doc;
}

function drawWatermark(doc: PDFKit.PDFDocument): void {
  try {
    const pageW = (doc as any).__pageW;
    const pageH = doc.page.height;
    const wmSize = 200;

    doc.save();
    doc.translate(pageW / 2, pageH / 2);
    doc.rotate(-45);
    doc.opacity(0.07);
    doc.image(LOGO_WATERMARK, -wmSize / 2, -wmSize / 2, { width: wmSize });
    doc.restore();
  } catch {
    // Watermark is non-critical; silently ignore failures
  }
}

export function addHeader(doc: PDFKit.PDFDocument): void {
  const info = (doc as any).__clinicInfo as ClinicInfo;
  if (!info) return;

  const startY = doc.y;
  const pageW = doc.page.width;
  const margin = 50;

  const logoW = 130;
  const textW = pageW - margin * 2 - logoW - 20;

  // Clinic info on the left
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor(PRIMARY)
    .text(info.name, margin, startY + 4, { width: textW });
  doc.fontSize(8).font('Helvetica').fillColor(TEXT_MUTED);
  const infoParts = [info.address, info.phone].filter(Boolean);
  const infoY = startY + 26;
  doc.text(infoParts.join(' | ') || '', margin, infoY, { width: textW });
  doc.text(`RNC: ${info.rnc}`, margin, infoY + 12, { width: textW });

  // Logo on the right (processed to pure black for visibility)
  try {
    if (!headerLogoBuffer) {
      headerLogoBuffer = loadHeaderLogoBlack();
    }
    if (headerLogoBuffer) {
      doc.image(headerLogoBuffer, margin + textW + 20, startY + 2, {
        width: logoW,
        align: 'right',
      });
    }
  } catch {
    // Logo unavailable; skip silently
  }

  doc.y = Math.max(startY + 48, startY + 2 + 60) + 6;
  doc.fillColor(TEXT_DARK);
}

export function addPageNumbers(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  if (range.count <= 1) return;

  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 45;
    doc
      .fontSize(8)
      .fillColor(TEXT_MUTED)
      .text(`Página ${i + 1} de ${range.count}`, 50, footerY, {
        align: 'center',
        width: doc.page.width - 100,
      });
  }
}

export async function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer | string) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
    );
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export function addSeparator(doc: PDFKit.PDFDocument): void {
  const y = doc.y + 2;
  doc.moveTo(50, y).lineWidth(0.5).lineTo(545, y).strokeColor(ACCENT).stroke();
  doc.moveDown(0.6);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function field(
  label: string,
  value: string | null | undefined | number,
  doc: PDFKit.PDFDocument,
): void {
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor(PRIMARY_LIGHT)
    .text(`${label}: `, { continued: true })
    .font('Helvetica')
    .fillColor(TEXT_DARK)
    .text(value != null ? String(value) : '—');
  doc.moveDown(0.12);
}

export function sectionTitle(title: string, doc: PDFKit.PDFDocument): void {
  doc.moveDown(0.4);
  const y = doc.y;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(PRIMARY).text(title);
  doc.moveDown(0.15);
  doc
    .moveTo(50, doc.y)
    .lineWidth(1.5)
    .lineTo(200, doc.y)
    .strokeColor(PRIMARY_LIGHT)
    .stroke();
  doc.moveDown(0.3);
  doc.fillColor(TEXT_DARK);
}

export function bulletList(
  items: string[] | null | undefined,
  doc: PDFKit.PDFDocument,
): void {
  if (!items || items.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_MUTED).text('Ninguno');
    doc.fillColor(TEXT_DARK);
    return;
  }
  items.forEach((item) => {
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK).text(`  • ${item}`);
  });
}

export function bodyText(text: string, doc: PDFKit.PDFDocument): void {
  doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK).text(text);
  doc.moveDown(0.1);
}

export function infoBox(
  label: string,
  value: string,
  doc: PDFKit.PDFDocument,
): void {
  const boxY = doc.y;
  doc.rect(50, boxY, 495, 18).fillColor('#f7fafc').fill();

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor(PRIMARY_LIGHT)
    .text(` ${label}: `, 55, boxY + 4, { continued: true })
    .font('Helvetica')
    .fillColor(TEXT_DARK)
    .text(value != null ? String(value) : '—');
  doc.fillColor(TEXT_DARK);
  doc.y = boxY + 22;
}
