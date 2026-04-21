import { Inject, Injectable } from '@nestjs/common';
import { MedicalRecord } from '@clinical/domain/entities/medical-record.entity';
import type { MedicalRecordRepository } from '@clinical/domain/ports/medical-record-repository.port';
import { MEDICAL_RECORD_REPOSITORY } from '@clinical/domain/ports/medical-record-repository.port';

export interface CreateMedicalRecordInput {
  patientId: string;
  doctorId: string;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string;
  treatment: string;
  notes: string;
}

export interface CreateMedicalRecordOutput {
  record: MedicalRecord;
}

@Injectable()
export class CreateMedicalRecordUseCase {
  constructor(
    @Inject(MEDICAL_RECORD_REPOSITORY) private readonly medicalRecordRepository: MedicalRecordRepository,
  ) {}

  async execute(input: CreateMedicalRecordInput): Promise<CreateMedicalRecordOutput> {
    const record = new MedicalRecord({
      id: crypto.randomUUID(),
      patientId: input.patientId,
      doctorId: input.doctorId,
      chiefComplaint: input.chiefComplaint,
      symptoms: input.symptoms,
      diagnosis: input.diagnosis,
      treatment: input.treatment,
      notes: input.notes,
      isSigned: false,
      signedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedRecord = await this.medicalRecordRepository.save(record);

    return { record: savedRecord };
  }
}