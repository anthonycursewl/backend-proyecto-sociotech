import { Inject, Injectable } from '@nestjs/common';
import { Appointment, AppointmentStatus } from '@scheduling/domain/entities/appointment.entity';
import type { AppointmentRepository } from '@scheduling/domain/ports/appointment-repository.port';
import { APPOINTMENT_REPOSITORY } from '@scheduling/domain/ports/appointment-repository.port';
import { AppointmentDate } from '@scheduling/domain/value-objects/appointment-date.vo';

export interface ScheduleAppointmentInput {
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  durationMinutes: number;
  reason: string;
  notes?: string;
}

export interface ScheduleAppointmentOutput {
  appointment: Appointment;
}

@Injectable()
export class ScheduleAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(input: ScheduleAppointmentInput): Promise<ScheduleAppointmentOutput> {
    const appointmentDate = new AppointmentDate(input.scheduledAt);

    if (!appointmentDate.isWeekday()) {
      throw new Error('Appointments cannot be scheduled on weekends');
    }

    if (!appointmentDate.isBusinessHours()) {
      throw new Error('Appointments must be scheduled during business hours (8:00 - 18:00)');
    }

    if (!appointmentDate.isInFuture()) {
      throw new Error('Appointments cannot be scheduled in the past');
    }

    const conflicting = await this.appointmentRepository.findConflicting(
      input.doctorId,
      input.scheduledAt,
      input.durationMinutes,
    );

    if (conflicting) {
      throw new Error('Doctor already has an appointment at this time');
    }

    const appointment = new Appointment({
      id: crypto.randomUUID(),
      patientId: input.patientId,
      doctorId: input.doctorId,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      status: AppointmentStatus.SCHEDULED,
      reason: input.reason,
      notes: input.notes || '',
      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    return { appointment: savedAppointment };
  }
}