import { Injectable } from '@nestjs/common';
import { MedicalRecord } from '@clinical/domain/entities/medical-record.entity';
import { MedicalRecordRepository } from '@clinical/domain/ports/medical-record-repository.port';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class PrismaMedicalRecordRepository implements MedicalRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(prismaRecord: any): MedicalRecord {
    return new MedicalRecord({
      id: prismaRecord.id,
      patientId: prismaRecord.patientId,
      doctorId: prismaRecord.doctorId,
      chiefComplaint: prismaRecord.chiefComplaint,
      symptoms: prismaRecord.symptoms,
      diagnosis: prismaRecord.diagnosis,
      treatment: prismaRecord.treatment,
      notes: prismaRecord.notes,
      isSigned: prismaRecord.isSigned,
      signedAt: prismaRecord.signedAt,
      createdAt: prismaRecord.createdAt,
      updatedAt: prismaRecord.updatedAt,
    });
  }

  async save(record: MedicalRecord): Promise<MedicalRecord> {
    const prismaRecord = await this.prisma.medicalRecord.create({
      data: {
        id: record.id,
        patientId: record.patientId,
        doctorId: record.doctorId,
        chiefComplaint: record.chiefComplaint,
        symptoms: record.symptoms,
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        notes: record.notes,
        isSigned: record.isSigned,
        signedAt: record.signedAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
    return this.toDomain(prismaRecord);
  }

  async findById(id: string): Promise<MedicalRecord | null> {
    const prismaRecord = await this.prisma.medicalRecord.findUnique({ where: { id } });
    return prismaRecord ? this.toDomain(prismaRecord) : null;
  }

  async findByPatientId(patientId: string): Promise<MedicalRecord[]> {
    const prismaRecords = await this.prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
    return prismaRecords.map((r) => this.toDomain(r));
  }

  async findByDoctorId(doctorId: string): Promise<MedicalRecord[]> {
    const prismaRecords = await this.prisma.medicalRecord.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
    });
    return prismaRecords.map((r) => this.toDomain(r));
  }

  async findUnsignedByDoctorId(doctorId: string): Promise<MedicalRecord[]> {
    const prismaRecords = await this.prisma.medicalRecord.findMany({
      where: {
        doctorId,
        isSigned: false,
      },
      orderBy: { createdAt: 'desc' },
    });
    return prismaRecords.map((r) => this.toDomain(r));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.medicalRecord.delete({ where: { id } });
  }

  async update(record: MedicalRecord): Promise<MedicalRecord> {
    const prismaRecord = await this.prisma.medicalRecord.update({
      where: { id: record.id },
      data: {
        chiefComplaint: record.chiefComplaint,
        symptoms: record.symptoms,
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        notes: record.notes,
        isSigned: record.isSigned,
        signedAt: record.signedAt,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(prismaRecord);
  }
}