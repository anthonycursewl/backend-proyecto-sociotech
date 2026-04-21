import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { MedicalRecord } from '../../domain/entities/medical-record.entity';
import { User } from '@identity/domain/entities/user.entity';
import { Patient } from '@identity/domain/entities/patient.entity';

export interface MedicalReportData {
  record: MedicalRecord;
  doctor: User;
  patient: Patient;
  generatedAt: Date;
}

export interface PdfGenerator {
  generateMedicalReport(data: MedicalReportData): Promise<Buffer>;
}

@Injectable()
export class PdfGeneratorService implements PdfGenerator {
  async generateMedicalReport(data: MedicalReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(20).text('CLÍNICA MÉDICA - REPORTE DE CONSULTA', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Fecha de emisión: ${data.generatedAt.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`);
        doc.moveDown(2);

        doc.fontSize(14).text('DATOS DEL PACIENTE', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Nombre: ${data.patient.firstName} ${data.patient.lastName}`);
        doc.text(`ID Médico: ${data.patient.medicalId}`);
        doc.text(`Fecha de nacimiento: ${data.patient.dateOfBirth.toLocaleDateString('es-ES')}`);
        doc.text(`Edad: ${data.patient.age} años`);
        doc.text(`Teléfono: ${data.patient.phone}`);
        doc.text(`Tipo de sangre: ${data.patient.bloodType || 'No especificado'}`);
        doc.text(`Alergias: ${data.patient.allergies.length > 0 ? data.patient.allergies.join(', ') : 'Ninguna'}`);
        doc.moveDown(2);

        doc.fontSize(14).text('DATOS DEL MÉDICO', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Nombre: ${data.doctor.firstName} ${data.doctor.lastName}`);
        doc.text(`Especialidad: ${data.doctor.role}`);
        doc.moveDown(2);

        doc.fontSize(14).text('INFORME MÉDICO', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Motivo de consulta: ${data.record.chiefComplaint}`);
        doc.moveDown(0.5);
        doc.text(`Síntomas: ${data.record.symptoms.join(', ')}`);
        doc.moveDown(0.5);
        doc.text(`Diagnóstico: ${data.record.diagnosis}`);
        doc.moveDown(0.5);
        doc.text(`Tratamiento: ${data.record.treatment}`);
        doc.moveDown(0.5);
        doc.text(`Notas adicionales: ${data.record.notes || 'Ninguna'}`);
        doc.moveDown(2);

        doc.fontSize(14).text('ESTADO DEL DOCUMENTO', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Firmado: ${data.record.isSigned ? 'Sí' : 'No'}`);
        if (data.record.signedAt) {
          doc.text(`Fecha de firma: ${data.record.signedAt.toLocaleDateString('es-ES')}`);
        }
        doc.moveDown(2);

        doc.fontSize(10).fillColor('#666');
        doc.text(`Documento generado automáticamente el ${new Date().toISOString()}`, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}