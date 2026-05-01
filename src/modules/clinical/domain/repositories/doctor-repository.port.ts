import { Doctor, DoctorProps } from '../entities/doctor.entity';

export const DOCTOR_REPOSITORY = Symbol('DOCTOR_REPOSITORY');

export interface DoctorRepository {
  save(doctor: Doctor): Promise<Doctor>;
  findById(id: string): Promise<Doctor | null>;
  findByUserId(userId: string): Promise<Doctor | null>;
  findAll(includeInactive?: boolean): Promise<Doctor[]>;
  update(id: string, data: Partial<Doctor>): Promise<Doctor>;
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
