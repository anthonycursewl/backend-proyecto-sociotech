import { Injectable, NotFoundException } from '@nestjs/common';
import { MedicalRecordService } from '../clinical/application/services/medical-record.service';
import { PatientService } from '../patient/application/services/patient.service';
import { DoctorService } from '../clinical/application/services/doctor.service';
import { AppointmentService } from '../appointments/application/services/appointment.service';
import { generatePrescriptionPdf } from './templates/prescription-pdf';
import type { PrescriptionPdfParams } from './templates/prescription-pdf';
import { generateClinicalHistoryPdf } from './templates/clinical-history-pdf';
import type {
  ClinicalHistoryPdfParams,
  HistoryRecordInfo,
} from './templates/clinical-history-pdf';
import { generateAppointmentPdf } from './templates/appointment-pdf';
import type { AppointmentPdfParams } from './templates/appointment-pdf';

@Injectable()
export class PdfService {
  constructor(
    private readonly medicalRecordService: MedicalRecordService,
    private readonly patientService: PatientService,
    private readonly doctorService: DoctorService,
    private readonly appointmentService: AppointmentService,
  ) {}

  async generatePrescription(medicalRecordId: string): Promise<Buffer> {
    const record = await this.medicalRecordService.findById(medicalRecordId);

    const patient = await this.patientService.findById(record.patientId);
    const doctor = await this.doctorService.findById(record.doctorId);

    const params: PrescriptionPdfParams = {
      doctor: {
        firstName: doctor.firstName ?? '',
        lastName: doctor.lastName ?? '',
        specialty: doctor.specialty,
        licenseNumber: doctor.licenseNumber,
        phoneNumber: doctor.phoneNumber,
      },
      patient: {
        firstName: patient.firstName ?? '',
        lastName: patient.lastName ?? '',
        medicalId: patient.medicalId,
        cedula: patient.cedula,
      },
      items: record.prescriptions.map((p) => ({
        medicationName: p.medicationName,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration,
        instructions: p.instructions,
      })),
      createdAt: record.createdAt,
      isSigned: record.isSigned,
    };

    return generatePrescriptionPdf(params);
  }

  async generateClinicalHistory(patientId: string): Promise<Buffer> {
    const patient = await this.patientService.findById(patientId);
    const records = await this.medicalRecordService.findByPatientId(patientId);

    const doctorIds = [...new Set(records.map((r) => r.doctorId))];
    const doctorMap = new Map<string, { name: string; specialty: string }>();
    for (const docId of doctorIds) {
      try {
        const doc = await this.doctorService.findById(docId);
        doctorMap.set(docId, {
          name: `${doc.firstName ?? ''} ${doc.lastName ?? ''}`.trim(),
          specialty: doc.specialty,
        });
      } catch {
        doctorMap.set(docId, { name: 'Médico desconocido', specialty: '' });
      }
    }

    const historyRecords: HistoryRecordInfo[] = records.map((r) => {
      const docInfo = doctorMap.get(r.doctorId);
      return {
        id: r.id,
        createdAt: r.createdAt,
        doctorName: docInfo?.name ?? 'Médico desconocido',
        doctorSpecialty: docInfo?.specialty ?? '',
        chiefComplaint: r.chiefComplaint,
        symptoms: r.symptoms,
        diagnosis: r.diagnosis,
        diagnosisCode: r.diagnosisCode,
        treatment: r.treatment,
        notes: r.notes,
        bloodPressure: r.bloodPressure,
        heartRate: r.heartRate,
        temperature: r.temperature,
        weight: r.weight,
        height: r.height,
        respiratoryRate: r.respiratoryRate,
        oxygenSaturation: r.oxygenSaturation,
        prescriptions: (r.prescriptions ?? []).map((p) => ({
          medicationName: p.medicationName,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          instructions: p.instructions,
        })),
      };
    });

    const patientProps = patient.toPlain();
    const params: ClinicalHistoryPdfParams = {
      patient: {
        firstName: patientProps.firstName ?? '',
        lastName: patientProps.lastName ?? '',
        medicalId: patientProps.medicalId,
        cedula: patientProps.cedula,
        dateOfBirth: patientProps.dateOfBirth,
        gender: patientProps.gender,
        phone: patientProps.phone,
        address: patientProps.address,
        bloodType: patientProps.bloodType,
        allergies: patientProps.allergies,
        chronicDiseases: patientProps.chronicDiseases,
        currentMedications: patientProps.currentMedications,
      },
      records: historyRecords,
    };

    return generateClinicalHistoryPdf(params);
  }

  async generateAppointmentDetail(appointmentId: string): Promise<Buffer> {
    const appointment = await this.appointmentService.findById(appointmentId);

    const doctor = appointment.doctor;
    const patient = appointment.patient;
    const service = appointment.service;
    const cancellation = appointment.cancellation;

    const params: AppointmentPdfParams = {
      id: appointment.id,
      doctor: {
        firstName: doctor?.firstName ?? '',
        lastName: doctor?.lastName ?? '',
        specialty: doctor?.specialty ?? '',
        phoneNumber: doctor?.phoneNumber ?? null,
      },
      patient: {
        firstName: patient?.firstName ?? '',
        lastName: patient?.lastName ?? '',
        medicalId: patient?.medicalId ?? '',
        cedula: patient?.cedula ?? null,
        phone: patient?.phone ?? '',
      },
      service: {
        name: service?.name ?? '',
        description: service?.description ?? null,
        durationMin: service?.durationMin ?? 0,
      },
      scheduledAt: appointment.scheduledAt,
      timeSlot: appointment.timeSlot,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      cancellation: cancellation
        ? {
            cancelledAt: cancellation.cancelledAt,
            cancellationReason: cancellation.cancellationReason,
          }
        : null,
      hasMedicalRecord: false,
    };

    return generateAppointmentPdf(params);
  }
}
