import { Doctor, DoctorProps } from '../entities/doctor.entity';

export const DOCTOR_REPOSITORY = Symbol('DOCTOR_REPOSITORY');

export interface DoctorSummary {
  id: string;
  userId: string;
  specialty: string;
  licenseNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  consultationPrice: number | null;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedDoctors {
  doctors: DoctorSummary[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface DoctorRepository {
  save(doctor: Doctor): Promise<Doctor>;
  findById(id: string): Promise<Doctor | null>;
  findByUserId(userId: string): Promise<Doctor | null>;
  findAll(includeInactive?: boolean): Promise<Doctor[]>;
  findManyCursor(
    cursor?: string,
    limit?: number,
    isActive?: boolean,
  ): Promise<PaginatedDoctors>;
  update(id: string, data: Doctor): Promise<Doctor>;
  delete(id: string): Promise<void>;
}

export interface CreateDoctorDto {
  userId: string;
  specialty: string;
  licenseNumber: string;
  consultationPrice?: number;
  biography?: string;
  phoneNumber?: string;
}
