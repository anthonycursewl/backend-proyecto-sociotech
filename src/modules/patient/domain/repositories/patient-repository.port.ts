import { Patient, PatientProps } from '../entities/patient.entity';

export const PATIENT_REPOSITORY = 'PATIENT_REPOSITORY';

export interface PatientSummary {
  id: string;
  userId: string;
  medicalId: string;
  firstName: string;
  lastName: string;
  email: string;
  cedula: string | null;
  dateOfBirth: Date;
  gender: string | null;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedPatients {
  patients: PatientSummary[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface PatientRepository {
  save(patient: Patient): Promise<Patient>;
  findById(id: string): Promise<Patient | null>;
  findByUserId(userId: string): Promise<Patient | null>;
  findByMedicalId(medicalId: string): Promise<Patient | null>;
  findAll(): Promise<Patient[]>;
  update(id: string, data: PatientProps): Promise<Patient>;
  delete(id: string): Promise<void>;
  search(query: string, limit?: number): Promise<Patient[]>;
  findManyCursor(cursor?: string, limit?: number, isActive?: boolean): Promise<PaginatedPatients>;
}
