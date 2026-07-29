import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsObject,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Appointment,
  AppointmentStatus,
  AppointmentDoctorData,
  AppointmentServiceData,
  AppointmentPatientData,
} from '../../domain/entities/appointment.entity';

export class CancellationResponseDto {
  @IsDateString()
  cancelledAt: string;

  @IsUUID()
  cancelledBy: string;

  @IsOptional()
  @IsString()
  cancellationReason: string | null;

  static fromEntity(c: {
    cancelledAt: Date;
    cancelledBy: string;
    cancellationReason: string | null;
  }): CancellationResponseDto {
    return {
      cancelledAt: c.cancelledAt.toISOString(),
      cancelledBy: c.cancelledBy,
      cancellationReason: c.cancellationReason,
    };
  }
}

export class DoctorSummaryDto {
  @IsUUID()
  id: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  fullName: string;

  @IsString()
  specialty: string;

  @IsOptional()
  @IsString()
  phoneNumber: string | null;

  static fromEntity(d: AppointmentDoctorData): DoctorSummaryDto {
    return {
      id: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      fullName: `${d.firstName} ${d.lastName}`.trim(),
      specialty: d.specialty,
      phoneNumber: d.phoneNumber,
    };
  }
}

export class ServiceSummaryDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string | null;

  @IsInt()
  durationMin: number;

  @IsOptional()
  @IsNumber()
  price: number | null;

  static fromEntity(s: AppointmentServiceData): ServiceSummaryDto {
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      durationMin: s.durationMin,
      price: s.price,
    };
  }
}

export class PatientSummaryDto {
  @IsUUID()
  id: string;

  @IsUUID()
  userId: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  fullName: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  medicalId: string;

  @IsOptional()
  @IsString()
  cedula: string | null;

  static fromEntity(p: AppointmentPatientData): PatientSummaryDto {
    return {
      id: p.id,
      userId: p.userId,
      firstName: p.firstName,
      lastName: p.lastName,
      fullName: p.fullName,
      email: p.email,
      phone: p.phone,
      medicalId: p.medicalId,
      cedula: p.cedula,
    };
  }
}

export class AppointmentResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  @IsUUID()
  serviceId: string;

  @IsDateString()
  scheduledAt: string;

  @IsString()
  timeSlot: string;

  @IsInt()
  durationMinutes: number;

  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CancellationResponseDto)
  cancellation: CancellationResponseDto | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DoctorSummaryDto)
  doctor: DoctorSummaryDto | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ServiceSummaryDto)
  service: ServiceSummaryDto | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PatientSummaryDto)
  patient: PatientSummaryDto | null;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;

  static fromEntity(apt: Appointment): AppointmentResponseDto {
    const dto = new AppointmentResponseDto();
    dto.id = apt.id;
    dto.patientId = apt.patientId;
    dto.doctorId = apt.doctorId;
    dto.serviceId = apt.serviceId;
    dto.scheduledAt = apt.scheduledAt.toISOString();
    dto.timeSlot = apt.timeSlot;
    dto.durationMinutes = apt.durationMinutes;
    dto.status = apt.status;
    dto.reason = apt.reason;
    dto.notes = apt.notes;
    dto.cancellation = apt.cancellation
      ? CancellationResponseDto.fromEntity(apt.cancellation)
      : null;
    dto.doctor = apt.doctor ? DoctorSummaryDto.fromEntity(apt.doctor) : null;
    dto.service = apt.service
      ? ServiceSummaryDto.fromEntity(apt.service)
      : null;
    dto.patient = apt.patient
      ? PatientSummaryDto.fromEntity(apt.patient)
      : null;
    dto.createdAt = apt.createdAt.toISOString();
    dto.updatedAt = apt.updatedAt.toISOString();
    return dto;
  }

  static fromEntities(appointments: Appointment[]): AppointmentResponseDto[] {
    return appointments.map((a) => AppointmentResponseDto.fromEntity(a));
  }
}

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  timeSlot?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CancelAppointmentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RescheduleAppointmentDto {
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AvailableSlotsQueryDto {
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}

export class MonthAvailabilityQueryDto {
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;
}

export enum MyAppointmentsFilter {
  PENDING = 'pending',
  UPCOMING = 'upcoming',
  HISTORY = 'history',
}

export class GetMyAppointmentsQueryDto {
  @IsOptional()
  @IsEnum(MyAppointmentsFilter)
  filter?: MyAppointmentsFilter;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  scheduledTo?: string;

  @IsOptional()
  @IsDateString()
  scheduledFrom?: string;
}

export enum AllAppointmentsFilter {
  UPCOMING = 'upcoming',
  PENDING = 'pending',
  HISTORY = 'history',
  ALL = 'all',
}

export class GetAllAppointmentsQueryDto {
  @IsOptional()
  @IsEnum(AllAppointmentsFilter)
  filter?: AllAppointmentsFilter;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  scheduledTo?: string;

  @IsOptional()
  @IsDateString()
  scheduledFrom?: string;
}
