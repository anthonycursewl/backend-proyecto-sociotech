import { Inject, Injectable } from '@nestjs/common';
import { Appointment, AppointmentStatus } from '@scheduling/domain/entities/appointment.entity';
import type { AppointmentRepository } from '@scheduling/domain/ports/appointment-repository.port';
import { APPOINTMENT_REPOSITORY } from '@scheduling/domain/ports/appointment-repository.port';
import { AppointmentDate } from '@scheduling/domain/value-objects/appointment-date.vo';

export interface RescheduleAppointmentInput {
  appointmentId: string;
  newScheduledAt: Date;
}

export interface RescheduleAppointmentOutput {
  appointment: Appointment;
}

@Injectable()
export class RescheduleAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(input: RescheduleAppointmentInput): Promise<RescheduleAppointmentOutput> {
    const appointment = await this.appointmentRepository.findById(input.appointmentId);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new Error('Cannot reschedule appointment that is already completed or cancelled');
    }

    const newDate = new AppointmentDate(input.newScheduledAt);

    if (!newDate.isWeekday()) {
      throw new Error('Appointments cannot be scheduled on weekends');
    }

    if (!newDate.isBusinessHours()) {
      throw new Error('Appointments must be scheduled during business hours (8:00 - 18:00)');
    }

    if (!newDate.isInFuture()) {
      throw new Error('Appointments cannot be scheduled in the past');
    }

    const conflicting = await this.appointmentRepository.findConflicting(
      appointment.doctorId,
      input.newScheduledAt,
      appointment.durationMinutes,
    );

    if (conflicting && conflicting.id !== appointment.id) {
      throw new Error('Doctor already has an appointment at this new time');
    }

    appointment.reschedule(input.newScheduledAt);

    const updatedAppointment = await this.appointmentRepository.update(appointment);

    return { appointment: updatedAppointment };
  }
}