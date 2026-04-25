import { Inject, Injectable } from '@nestjs/common';
import { Appointment, AppointmentStatus } from '@scheduling/domain/entities/appointment.entity';
import type { AppointmentRepository } from '@scheduling/domain/ports/appointment-repository.port';
import { APPOINTMENT_REPOSITORY } from '@scheduling/domain/ports/appointment-repository.port';

export interface CancelAppointmentInput {
  appointmentId: string;
  cancelledBy: string;
  reason: string;
}

export interface CancelAppointmentOutput {
  appointment: Appointment;
}

@Injectable()
export class CancelAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(input: CancelAppointmentInput): Promise<CancelAppointmentOutput> {
    const appointment = await this.appointmentRepository.findById(input.appointmentId);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new Error('Cannot cancel appointment that is already completed or cancelled');
    }

    appointment.cancel(input.cancelledBy, input.reason);

    const updatedAppointment = await this.appointmentRepository.update(appointment);

    return { appointment: updatedAppointment };
  }
}