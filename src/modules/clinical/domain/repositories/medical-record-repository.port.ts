import { MedicalRecord } from '../entities/medical-record.entity';

export const MEDICAL_RECORD_REPOSITORY = Symbol('MEDICAL_RECORD_REPOSITORY');

export interface CursorPagination {
  cursor?: string;
  limit?: number;
}

export interface MedicalRecordRepository {
  save(record: MedicalRecord): Promise<MedicalRecord>;
  findById(id: string): Promise<MedicalRecord | null>;
  findAll(pagination?: CursorPagination): Promise<MedicalRecord[]>;
  findByPatientId(
    patientId: string,
    pagination?: CursorPagination,
  ): Promise<MedicalRecord[]>;
  findByDoctorId(
    doctorId: string,
    pagination?: CursorPagination,
  ): Promise<MedicalRecord[]>;
  findUnsignedByDoctorId(doctorId: string): Promise<MedicalRecord[]>;
  findByAppointmentId(appointmentId: string): Promise<MedicalRecord | null>;
  delete(id: string): Promise<void>;
  update(record: MedicalRecord): Promise<MedicalRecord>;
}
