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
  bodyText,
  infoBox,
} from './pdf-utils';

export interface AppointmentPdfDoctor {
  firstName: string;
  lastName: string;
  specialty: string;
  phoneNumber?: string | null;
}

export interface AppointmentPdfPatient {
  firstName: string;
  lastName: string;
  medicalId: string;
  cedula?: string | null;
  phone: string;
}

export interface AppointmentPdfService {
  name: string;
  description?: string | null;
  durationMin: number;
  price?: number | null;
}

export interface AppointmentPdfCancellation {
  cancelledAt: Date | string;
  cancellationReason?: string | null;
}

export interface AppointmentPdfParams {
  id: string;
  doctor: AppointmentPdfDoctor;
  patient: AppointmentPdfPatient;
  service: AppointmentPdfService;
  scheduledAt: Date | string;
  timeSlot: string;
  status: string;
  reason: string;
  notes?: string | null;
  createdAt: Date | string;
  cancellation?: AppointmentPdfCancellation | null;
  hasMedicalRecord: boolean;
}

const PRIMARY = '#1e3a5f';
const PRIMARY_LIGHT = '#2c5282';
const TEXT_MUTED = '#718096';
const TEXT_DARK = '#1a202c';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#2b6cb0',
  CONFIRMED: '#2f855a',
  COMPLETED: '#2d3748',
  CANCELLED: '#c53030',
  NO_SHOW: '#9b2c2c',
};

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'Programada',
    CONFIRMED: 'Confirmada',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'No Asistió',
  };
  return map[status] || status;
}

function writeDoctorInfo(
  doc: PDFKit.PDFDocument,
  doctor: AppointmentPdfDoctor,
): void {
  const fullName = `${doctor.firstName} ${doctor.lastName}`;
  infoBox('Nombre', fullName, doc);
  field('Especialidad', doctor.specialty, doc);
  if (doctor.phoneNumber) field('Teléfono', doctor.phoneNumber, doc);
}

function writePatientInfo(
  doc: PDFKit.PDFDocument,
  patient: AppointmentPdfPatient,
): void {
  const fullName = `${patient.firstName} ${patient.lastName}`;
  infoBox('Nombre', fullName, doc);
  field('Expediente', patient.medicalId, doc);
  if (patient.cedula) field('Cédula', patient.cedula, doc);
  field('Teléfono', patient.phone, doc);
}

function writeServiceInfo(
  doc: PDFKit.PDFDocument,
  service: AppointmentPdfService,
): void {
  field('Servicio', service.name, doc);
  if (service.description) bodyText(service.description, doc);
  field('Duración', `${service.durationMin} min`, doc);
  if (service.price != null)
    field('Precio', `$${service.price.toFixed(2)}`, doc);
}

function writeStatusBadge(doc: PDFKit.PDFDocument, status: string): void {
  const label = statusLabel(status);
  const color = STATUS_COLORS[status] || TEXT_MUTED;
  const y = doc.y;

  doc.rect(50, y, 130, 20).fillColor(color).fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#ffffff')
    .text(label, 55, y + 4, { width: 120 });
  doc.fillColor(TEXT_DARK);
  doc.y = y + 24;
}

function writeAppointmentDetails(
  doc: PDFKit.PDFDocument,
  params: AppointmentPdfParams,
): void {
  field('Fecha', `${formatDate(params.scheduledAt)} — ${params.timeSlot}`, doc);

  writeStatusBadge(doc, params.status);

  field('Motivo', params.reason, doc);
  if (params.notes) {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(PRIMARY_LIGHT)
      .text('Notas:');
    bodyText(params.notes, doc);
  }
}

function writeCancellationInfo(
  doc: PDFKit.PDFDocument,
  cancellation: AppointmentPdfCancellation,
): void {
  doc.moveDown(0.3);
  doc.rect(50, doc.y, 495, 20).fillColor('#fff5f5').fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#c53030')
    .text(' Cita Cancelada', 55, doc.y - 16);
  doc.fillColor(TEXT_DARK);
  doc.moveDown(0.3);
  field('Fecha de Cancelación', formatDateTime(cancellation.cancelledAt), doc);
  if (cancellation.cancellationReason) {
    field('Motivo', cancellation.cancellationReason, doc);
  }
}

export async function generateAppointmentPdf(
  params: AppointmentPdfParams,
): Promise<Buffer> {
  const doc = createPdfDocument('Detalle de Cita');
  addHeader(doc);

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor(PRIMARY)
    .text('DETALLE DE CITA', { align: 'center' });
  doc.moveDown(0.5);

  addSeparator(doc);

  sectionTitle('Datos del Médico', doc);
  writeDoctorInfo(doc, params.doctor);

  addSeparator(doc);

  sectionTitle('Datos del Paciente', doc);
  writePatientInfo(doc, params.patient);

  addSeparator(doc);

  sectionTitle('Servicio', doc);
  writeServiceInfo(doc, params.service);

  addSeparator(doc);

  sectionTitle('Información de la Cita', doc);
  writeAppointmentDetails(doc, params);

  if (params.cancellation) {
    addSeparator(doc);
    writeCancellationInfo(doc, params.cancellation);
  }

  doc.moveDown(1);
  doc
    .fontSize(7)
    .font('Helvetica')
    .fillColor(TEXT_MUTED)
    .text(
      `ID Cita: ${params.id} | Registrada: ${formatDateTime(params.createdAt)}`,
      50,
      doc.y,
      { align: 'center' },
    )
    .fillColor(TEXT_DARK);

  if (params.hasMedicalRecord) {
    doc.moveDown(0.3);
    doc
      .fontSize(8)
      .fillColor(PRIMARY_LIGHT)
      .text('Esta cita tiene un historial clínico asociado.', {
        align: 'center',
      })
      .fillColor(TEXT_DARK);
  }

  addPageNumbers(doc);
  return pdfToBuffer(doc);
}
