import { IsString, IsUUID, IsOptional, IsNumber, IsPositive, Min, Max, IsDateString } from 'class-validator';

export class ScheduleAppointmentDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  doctorId!: string;

  @IsString()
  scheduledAt!: string;

  @IsNumber()
  @IsPositive()
  @Min(15)
  @Max(180)
  durationMinutes!: number;

  @IsString()
  @Min(5)
  reason!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelAppointmentDto {
  @IsUUID()
  cancelledBy!: string;

  @IsString()
  reason!: string;
}

export class RescheduleAppointmentDto {
  @IsString()
  newScheduledAt!: string;
}