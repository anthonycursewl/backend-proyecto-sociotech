import { MedicalRecord } from '../entities/medical-record.entity';

export const MEDICAL_RECORD_REPOSITORY = Symbol('MEDICAL_RECORD_REPOSITORY');

export interface MedicalRecordRepository {
  save(record: MedicalRecord): Promise<MedicalRecord>;
  findById(id: string): Promise<MedicalRecord | null>;
  findByPatientId(patientId: string): Promise<MedicalRecord[]>;
  findByDoctorId(doctorId: string): Promise<MedicalRecord[]>;
  findUnsignedByDoctorId(doctorId: string): Promise<MedicalRecord[]>;
  delete(id: string): Promise<void>;
  update(record: MedicalRecord): Promise<MedicalRecord>;
}
