import { Inject, Injectable } from '@nestjs/common';
import { MedicalRecord } from '@clinical/domain/entities/medical-record.entity';
import type { MedicalRecordRepository } from '@clinical/domain/ports/medical-record-repository.port';
import { MEDICAL_RECORD_REPOSITORY } from '@clinical/domain/ports/medical-record-repository.port';

export interface SignMedicalRecordInput {
  recordId: string;
  doctorId: string;
}

export interface SignMedicalRecordOutput {
  record: MedicalRecord;
}

@Injectable()
export class SignMedicalRecordUseCase {
  constructor(
    @Inject(MEDICAL_RECORD_REPOSITORY) private readonly medicalRecordRepository: MedicalRecordRepository,
  ) {}

  async execute(input: SignMedicalRecordInput): Promise<SignMedicalRecordOutput> {
    const record = await this.medicalRecordRepository.findById(input.recordId);

    if (!record) {
      throw new Error('Medical record not found');
    }

    if (record.doctorId !== input.doctorId) {
      throw new Error('Only the doctor who created the record can sign it');
    }

    if (record.isSigned) {
      throw new Error('Medical record is already signed');
    }

    record.sign();

    const updatedRecord = await this.medicalRecordRepository.update(record);

    return { record: updatedRecord };
  }
}