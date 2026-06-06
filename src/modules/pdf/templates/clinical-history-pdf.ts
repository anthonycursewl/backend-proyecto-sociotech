import {
  createPdfDocument,
  addHeader,
  addPageNumbers,
  pdfToBuffer,
  addSeparator,
  formatDate,
  formatDateTime,
  field,
  sectionTitle,
  bulletList,
  bodyText,
  infoBox,
} from './pdf-utils';

export interface HistoryPatientInfo {
  firstName: string;
  lastName: string;
  medicalId: string;
  cedula?: string | null;
  dateOfBirth?: Date | string;
  gender?: string | null;
  phone: string;
  address: string;
  bloodType?: string | null;
  allergies: string[];
  chronicDiseases: string[];
  currentMedications: string[];
}

export interface HistoryRecordInfo {
  id: string;
  createdAt: Date;
  doctorName: string;
  doctorSpecialty: string;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string;
  diagnosisCode?: string | null;
  treatment: string;
  notes: string;
  bloodPressure?: string | null;
  heartRate?: number | null;
  temperature?: number | null;
  weight?: number | null;
  height?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  prescriptions: Array<{
    medicationName: string;
    dosage?: string | null;
    frequency?: string | null;
    duration?: string | null;
    instructions?: string | null;
  }>;
}

export interface ClinicalHistoryPdfParams {
  patient: HistoryPatientInfo;
  records: HistoryRecordInfo[];
}

const PRIMARY = '#1e3a5f';
const PRIMARY_LIGHT = '#2c5282';
const TEXT_MUTED = '#718096';
const TEXT_DARK = '#1a202c';

function writePatientHeader(
  doc: PDFKit.PDFDocument,
  patient: HistoryPatientInfo,
): void {
  const fullName = `${patient.firstName} ${patient.lastName}`;
  infoBox('Nombre', fullName, doc);
  field('Expediente', patient.medicalId, doc);
  if (patient.cedula) field('Cédula', patient.cedula, doc);
  if (patient.dateOfBirth)
    field('Fecha de Nacimiento', formatDate(patient.dateOfBirth), doc);
  if (patient.gender) field('Sexo', patient.gender, doc);
  if (patient.bloodType) field('Tipo de Sangre', patient.bloodType, doc);
  field('Teléfono', patient.phone, doc);
  field('Dirección', patient.address, doc);
}

function writeMedicalSummary(
  doc: PDFKit.PDFDocument,
  patient: HistoryPatientInfo,
): void {
  sectionTitle('Resumen Médico', doc);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY_LIGHT).text('Alergias:');
  bulletList(patient.allergies, doc);
  doc.moveDown(0.15);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY_LIGHT).text('Enfermedades Crónicas:');
  bulletList(patient.chronicDiseases, doc);
  doc.moveDown(0.15);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY_LIGHT).text('Medicamentos Actuales:');
  bulletList(patient.currentMedications, doc);
  doc.fillColor(TEXT_DARK);
}

function writeVitalSigns(
  doc: PDFKit.PDFDocument,
  record: HistoryRecordInfo,
): void {
  const vitals: string[] = [];
  if (record.bloodPressure) vitals.push(`PA: ${record.bloodPressure}`);
  if (record.heartRate != null) vitals.push(`FC: ${record.heartRate} lpm`);
  if (record.temperature != null) vitals.push(`Temp: ${record.temperature}°C`);
  if (record.weight != null) vitals.push(`Peso: ${record.weight} kg`);
  if (record.height != null) vitals.push(`Talla: ${record.height} cm`);
  if (record.respiratoryRate != null)
    vitals.push(`FR: ${record.respiratoryRate} rpm`);
  if (record.oxygenSaturation != null)
    vitals.push(`SpO2: ${record.oxygenSaturation}%`);

  if (vitals.length > 0) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY_LIGHT).text('Signos Vitales:');
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK)
      .text(`  ${vitals.join(' | ')}`);
    doc.moveDown(0.15);
  }
}

function writePrescriptions(
  doc: PDFKit.PDFDocument,
  prescriptions: HistoryRecordInfo['prescriptions'],
): void {
  if (prescriptions.length === 0) return;

  doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY_LIGHT).text('Recetario:');
  prescriptions.forEach((p, i) => {
    const parts = [p.medicationName];
    if (p.dosage) parts.push(`${p.dosage}`);
    if (p.frequency) parts.push(`c/${p.frequency}`);
    if (p.duration) parts.push(`x${p.duration}`);
    doc.font('Helvetica').fontSize(8).fillColor(TEXT_DARK)
      .text(`  ${i + 1}. ${parts.join(' — ')}`);
    if (p.instructions) {
      doc.fontSize(7).fillColor(TEXT_MUTED)
        .text(`     Indicaciones: ${p.instructions}`);
    }
  });
  doc.moveDown(0.2);
}

function writeRecordCard(
  doc: PDFKit.PDFDocument,
  record: HistoryRecordInfo,
  index: number,
): void {
  doc.moveDown(0.3);

  // Record card header bar
  doc.rect(50, doc.y, 495, 22)
    .fillColor(PRIMARY)
    .fill();
  const headerY = doc.y;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
  doc.text(
    `#${index} — ${formatDateTime(record.createdAt)}`,
    55, headerY + 4,
  );
  doc.font('Helvetica').fontSize(8);
  doc.text(`Dr. ${record.doctorName}`, 55, headerY + 13);
  doc.fillColor(TEXT_DARK);
  doc.y = headerY + 26;

  // Card body
  doc.rect(50, doc.y, 495, 1).fillColor('#e2e8f0').fill();
  doc.moveDown(0.2);

  field('Motivo de Consulta', record.chiefComplaint, doc);
  field('Diagnóstico', `${record.diagnosis}${record.diagnosisCode ? ` (CIE-10: ${record.diagnosisCode})` : ''}`, doc);
  field('Tratamiento', record.treatment, doc);

  if (record.symptoms.length > 0) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY_LIGHT).text('Síntomas:');
    bulletList(record.symptoms, doc);
    doc.fillColor(TEXT_DARK);
  }

  writeVitalSigns(doc, record);

  if (record.notes) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY_LIGHT).text('Notas:');
    bodyText(record.notes, doc);
  }

  writePrescriptions(doc, record.prescriptions);
}

export async function generateClinicalHistoryPdf(
  params: ClinicalHistoryPdfParams,
): Promise<Buffer> {
  const doc = createPdfDocument('Historial Clínico');
  addHeader(doc);

  doc.fontSize(16).font('Helvetica-Bold')
    .fillColor(PRIMARY)
    .text('HISTORIAL CLÍNICO', { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_MUTED)
    .text(`Generado: ${formatDateTime(new Date())}`, { align: 'center' })
    .fillColor(TEXT_DARK);
  doc.moveDown(0.5);

  addSeparator(doc);

  sectionTitle('Datos del Paciente', doc);
  writePatientHeader(doc, params.patient);

  addSeparator(doc);

  writeMedicalSummary(doc, params.patient);

  addSeparator(doc);

  sectionTitle('Registros Médicos', doc);

  if (params.records.length === 0) {
    bodyText('No se encontraron registros médicos para este paciente.', doc);
  } else {
    params.records.forEach((record, i) => {
      writeRecordCard(doc, record, i + 1);
    });
  }

  doc.moveDown(1);
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_MUTED)
    .text('— Fin del Historial Clínico —', 50, doc.y, { align: 'center' })
    .fillColor(TEXT_DARK);

  addPageNumbers(doc);
  return pdfToBuffer(doc);
}
