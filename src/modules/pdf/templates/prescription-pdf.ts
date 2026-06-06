import {
  createPdfDocument,
  addHeader,
  addPageNumbers,
  pdfToBuffer,
  addSeparator,
  formatDate,
  field,
  sectionTitle,
} from './pdf-utils';

export interface PrescriptionDoctorInfo {
  firstName: string;
  lastName: string;
  specialty: string;
  licenseNumber: string;
  phoneNumber?: string | null;
}

export interface PrescriptionPatientInfo {
  firstName: string;
  lastName: string;
  medicalId: string;
  cedula?: string | null;
}

export interface PrescriptionItemInfo {
  medicationName: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

export interface PrescriptionPdfParams {
  doctor: PrescriptionDoctorInfo;
  patient: PrescriptionPatientInfo;
  items: PrescriptionItemInfo[];
  createdAt?: Date;
  isSigned?: boolean;
}

const PRIMARY_LIGHT = '#2c5282';
const TEXT_MUTED = '#718096';

function writeDoctorInfo(
  doc: PDFKit.PDFDocument,
  doctor: PrescriptionDoctorInfo,
): void {
  field('Médico', `${doctor.firstName} ${doctor.lastName}`, doc);
  field('Especialidad', doctor.specialty, doc);
  field('Cédula Profesional', doctor.licenseNumber, doc);
  if (doctor.phoneNumber) {
    field('Teléfono', doctor.phoneNumber, doc);
  }
}

function writePatientInfo(
  doc: PDFKit.PDFDocument,
  patient: PrescriptionPatientInfo,
): void {
  field('Paciente', `${patient.firstName} ${patient.lastName}`, doc);
  field('Expediente', patient.medicalId, doc);
  if (patient.cedula) {
    field('Cédula', patient.cedula, doc);
  }
}

function writePrescriptionsTable(
  doc: PDFKit.PDFDocument,
  items: PrescriptionItemInfo[],
): void {
  if (items.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_MUTED)
      .text('No se recetaron medicamentos.')
      .fillColor('#000000');
    return;
  }

  const colX = [50, 170, 240, 310, 370];
  const colW = [120, 70, 70, 60, 175];
  const totalW = colW.reduce((a, b) => a + b, 0);

  const drawHeader = (y: number): number => {
    const h = 20;
    doc.rect(colX[0], y, totalW, h)
      .fillColor(PRIMARY_LIGHT)
      .fill();
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
    doc.text('Medicamento', colX[0] + 3, y + 5, { width: colW[0] - 4 });
    doc.text('Dosis', colX[1] + 3, y + 5, { width: colW[1] - 4 });
    doc.text('Frecuencia', colX[2] + 3, y + 5, { width: colW[2] - 4 });
    doc.text('Duración', colX[3] + 3, y + 5, { width: colW[3] - 4 });
    doc.text('Indicaciones', colX[4] + 3, y + 5, { width: colW[4] - 4 });
    doc.fillColor('#000000');
    return y + h + 2;
  };

  const drawRow = (item: PrescriptionItemInfo, y: number, idx: number): number => {
    const values = [
      item.medicationName,
      item.dosage || '—',
      item.frequency || '—',
      item.duration || '—',
      item.instructions || '—',
    ];
    let rowH = 16;
    values.forEach((v, i) => {
      const h = doc.heightOfString(v, { width: colW[i] - 4 });
      if (h > rowH) rowH = h;
    });

    if (y + rowH > doc.page.height - 80) {
      doc.addPage();
      y = doc.y + 5;
      y = drawHeader(y);
    }

    // Alternating row background
    if (idx % 2 === 1) {
      doc.rect(colX[0], y, totalW, rowH + 3)
        .fillColor('#f7fafc')
        .fill();
    }

    doc.font('Helvetica').fontSize(8).fillColor('#2d3748');
    values.forEach((v, i) => {
      doc.text(v, colX[i] + 2, y + 2, { width: colW[i] - 4 });
    });
    doc.fillColor('#000000');

    const sepY = y + rowH + 2;
    doc.lineWidth(0.3)
      .moveTo(colX[0], sepY)
      .lineTo(colX[0] + totalW, sepY)
      .strokeColor('#e2e8f0')
      .stroke();

    return sepY + 2;
  };

  doc.moveDown(0.2);
  let y = drawHeader(doc.y);
  items.forEach((item, i) => {
    y = drawRow(item, y, i);
  });
  doc.y = y;
}

function writeSignature(doc: PDFKit.PDFDocument): void {
  doc.moveDown(2.5);
  const lineY = doc.y;
  doc.moveTo(180, lineY)
    .lineTo(420, lineY)
    .lineWidth(1)
    .strokeColor(PRIMARY_LIGHT)
    .stroke();
  doc.moveDown(0.15);
  doc.font('Helvetica')
    .fontSize(9)
    .fillColor(TEXT_MUTED)
    .text('Firma del Médico', 180, doc.y, { align: 'center', width: 240 });
  doc.fillColor('#000000');
  doc.moveDown(0.5);
  doc.fontSize(7)
    .fillColor(TEXT_MUTED)
    .text(
      'Documento generado electrónicamente. Válido solo con firma y sello del médico tratante.',
      50,
      doc.y,
      { align: 'center' },
    );
  doc.fillColor('#000000');
}

export async function generatePrescriptionPdf(
  params: PrescriptionPdfParams,
): Promise<Buffer> {
  const doc = createPdfDocument('Receta Médica');
  addHeader(doc);

  doc.fontSize(16).font('Helvetica-Bold')
    .fillColor('#1e3a5f')
    .text('RECETA MÉDICA', { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(9)
    .font('Helvetica')
    .fillColor(TEXT_MUTED)
    .text(`Fecha: ${formatDate(params.createdAt ?? new Date())}`, {
      align: 'center',
    })
    .fillColor('#000000');
  doc.moveDown(0.5);

  addSeparator(doc);

  sectionTitle('Datos del Médico', doc);
  writeDoctorInfo(doc, params.doctor);

  addSeparator(doc);

  sectionTitle('Datos del Paciente', doc);
  writePatientInfo(doc, params.patient);

  addSeparator(doc);

  sectionTitle('Medicamentos Recetados', doc);
  writePrescriptionsTable(doc, params.items);

  if (params.isSigned) {
    writeSignature(doc);
  }

  addPageNumbers(doc);
  return pdfToBuffer(doc);
}
