import { Injectable } from '@nestjs/common';
import {
  MedicalRecordRepository,
  CursorPagination,
} from '../../domain/repositories/medical-record-repository.port';
import {
  MedicalRecord,
  MedicalRecordProps,
  PrescriptionProps,
} from '../../domain/entities/medical-record.entity';
import { PrismaService } from '../db/prisma.service';

const INCLUDE_PRESCRIPTIONS = { prescriptions: true } as const;

@Injectable()
export class PrismaMedicalRecordRepository implements MedicalRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(
    raw: MedicalRecordProps & { prescriptions?: PrescriptionProps[] },
  ): MedicalRecord {
    return new MedicalRecord(raw);
  }

  async save(record: MedicalRecord): Promise<MedicalRecord> {
    const data = record.toPlain();
    const created = await this.prisma.medicalRecord.create({
      data: {
        id: data.id,
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentId: data.appointmentId,
        chiefComplaint: data.chiefComplaint,
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        diagnosisCode: data.diagnosisCode,
        treatment: data.treatment,
        notes: data.notes,
        isSigned: data.isSigned,
        signedAt: data.signedAt,
        bloodPressure: data.bloodPressure,
        heartRate: data.heartRate,
        temperature: data.temperature,
        weight: data.weight,
        height: data.height,
        respiratoryRate: data.respiratoryRate,
        oxygenSaturation: data.oxygenSaturation,
        ...(data.prescriptions.length > 0 && {
          prescriptions: {
            create: data.prescriptions.map((p) => ({
              id: p.id,
              medicationName: p.medicationName,
              dosage: p.dosage,
              frequency: p.frequency,
              duration: p.duration,
              instructions: p.instructions,
            })),
          },
        }),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      include: INCLUDE_PRESCRIPTIONS,
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<MedicalRecord | null> {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: INCLUDE_PRESCRIPTIONS,
    });
    return record ? this.toDomain(record) : null;
  }

  async findByPatientId(
    patientId: string,
    pagination?: CursorPagination,
  ): Promise<MedicalRecord[]> {
    const take = pagination?.limit ? pagination.limit + 1 : undefined;
    const records = await this.prisma.medicalRecord.findMany({
      where: {
        patientId,
        ...(pagination?.cursor ? { id: { lt: pagination.cursor } } : {}),
      },
      take,
      include: INCLUDE_PRESCRIPTIONS,
      orderBy: { id: 'desc' },
    });
    const items =
      take && records.length > pagination!.limit!
        ? records.slice(0, pagination!.limit)
        : records;
    return items.map((r) =>
      this.toDomain(
        r as MedicalRecordProps & { prescriptions: PrescriptionProps[] },
      ),
    );
  }

  async findByDoctorId(
    doctorId: string,
    pagination?: CursorPagination,
  ): Promise<MedicalRecord[]> {
    const take = pagination?.limit ? pagination.limit + 1 : undefined;
    const records = await this.prisma.medicalRecord.findMany({
      where: {
        doctorId,
        ...(pagination?.cursor ? { id: { lt: pagination.cursor } } : {}),
      },
      take,
      include: INCLUDE_PRESCRIPTIONS,
      orderBy: { id: 'desc' },
    });
    const items =
      take && records.length > pagination!.limit!
        ? records.slice(0, pagination!.limit)
        : records;
    return items.map((r) =>
      this.toDomain(
        r as MedicalRecordProps & { prescriptions: PrescriptionProps[] },
      ),
    );
  }

  async findUnsignedByDoctorId(doctorId: string): Promise<MedicalRecord[]> {
    const records = await this.prisma.medicalRecord.findMany({
      where: { doctorId, isSigned: false },
      include: INCLUDE_PRESCRIPTIONS,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) =>
      this.toDomain(
        r as MedicalRecordProps & { prescriptions: PrescriptionProps[] },
      ),
    );
  }

  async findByAppointmentId(
    appointmentId: string,
  ): Promise<MedicalRecord | null> {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { appointmentId },
      include: INCLUDE_PRESCRIPTIONS,
    });
    return record ? this.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.medicalRecord.delete({ where: { id } });
  }

  async update(record: MedicalRecord): Promise<MedicalRecord> {
    const data = record.toPlain();
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.medicalPrescription.deleteMany({
        where: { medicalRecordId: data.id },
      });
      if (data.prescriptions.length > 0) {
        await tx.medicalPrescription.createMany({
          data: data.prescriptions.map((p) => ({
            id: p.id,
            medicalRecordId: data.id,
            medicationName: p.medicationName,
            dosage: p.dosage,
            frequency: p.frequency,
            duration: p.duration,
            instructions: p.instructions,
          })),
        });
      }
      return tx.medicalRecord.update({
        where: { id: data.id },
        data: {
          chiefComplaint: data.chiefComplaint,
          symptoms: data.symptoms,
          diagnosis: data.diagnosis,
          diagnosisCode: data.diagnosisCode,
          treatment: data.treatment,
          notes: data.notes,
          isSigned: data.isSigned,
          signedAt: data.signedAt,
          bloodPressure: data.bloodPressure,
          heartRate: data.heartRate,
          temperature: data.temperature,
          weight: data.weight,
          height: data.height,
          respiratoryRate: data.respiratoryRate,
          oxygenSaturation: data.oxygenSaturation,
          updatedAt: new Date(),
        },
        include: INCLUDE_PRESCRIPTIONS,
      });
    });
    return this.toDomain(updated);
  }
}
