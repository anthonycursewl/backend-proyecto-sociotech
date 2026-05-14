import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray } from 'class-validator';
import { Patient } from '../../domain/entities/patient.entity';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  cedula: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  civilStatus?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  emergencyContact: string;

  @IsString()
  @IsNotEmpty()
  emergencyPhone: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicDiseases?: string[];
}

export class UpdatePatientDto {
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  civilStatus?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicDiseases?: string[];
}

export class RegisterPatientDto {
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  civilStatus?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  emergencyContact: string;

  @IsString()
  @IsNotEmpty()
  emergencyPhone: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicDiseases?: string[];
}

export interface PatientResponse {
  id: string;
  userId: string;
  medicalId: string;
  cedula: string | null;
  dateOfBirth: string;
  gender: string | null;
  occupation: string | null;
  civilStatus: string | null;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string | null;
  allergies: string[];
  currentMedications: string[];
  chronicDiseases: string[];
  createdAt: string;
  updatedAt: string;
}

export function toPatientResponse(patient: Patient): PatientResponse {
  return {
    id: patient.id,
    userId: patient.userId,
    medicalId: patient.medicalId,
    cedula: patient.cedula ?? null,
    dateOfBirth: patient.dateOfBirth.toISOString(),
    gender: patient.gender ?? null,
    occupation: patient.occupation ?? null,
    civilStatus: patient.civilStatus ?? null,
    phone: patient.phone,
    address: patient.address,
    emergencyContact: patient.emergencyContact,
    emergencyPhone: patient.emergencyPhone,
    bloodType: patient.bloodType ?? null,
    allergies: patient.allergies,
    currentMedications: patient.currentMedications,
    chronicDiseases: patient.chronicDiseases,
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };
}
