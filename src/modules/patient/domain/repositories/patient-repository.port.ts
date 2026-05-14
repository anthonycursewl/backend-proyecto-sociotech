import { Patient, PatientProps } from '../entities/patient.entity';

export const PATIENT_REPOSITORY = 'PATIENT_REPOSITORY';

export interface PatientRepository {
  save(patient: Patient): Promise<Patient>;
  findById(id: string): Promise<Patient | null>;
  findByUserId(userId: string): Promise<Patient | null>;
  findByMedicalId(medicalId: string): Promise<Patient | null>;
  findAll(): Promise<Patient[]>;
  update(id: string, data: PatientProps): Promise<Patient>;
  delete(id: string): Promise<void>;
  search(query: string, limit?: number): Promise<Patient[]>;
}
