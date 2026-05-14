import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment-repository.port';
import {
  Appointment,
  AppointmentStatus,
} from '../../domain/entities/appointment.entity';
import {
  CreateAppointmentDto,
  CancelAppointmentDto,
} from '../../presentation/controllers/appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepo: any,
  ) {}

  async create(
    patientId: string,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const scheduledDate = new Date(dto.scheduledAt);
    const now = new Date();

    if (scheduledDate < now) {
      throw new BadRequestException('Cannot schedule appointment in the past');
    }

    const appointment = new Appointment({
      id: crypto.randomUUID(),
      patientId,
      doctorId: dto.doctorId,
      serviceId: dto.serviceId,
      scheduledAt: scheduledDate,
      timeSlot: dto.timeSlot,
      durationMinutes: 30,
      status: AppointmentStatus.SCHEDULED,
      reason: dto.reason,
      notes: dto.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.appointmentRepo.save(appointment);
  }

  async findById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findById(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    return await this.appointmentRepo.findByPatientId(patientId);
  }

  async findAll(): Promise<Appointment[]> {
    return await this.appointmentRepo.findAll();
  }

  async findByDoctorId(doctorId: string): Promise<Appointment[]> {
    return await this.appointmentRepo.findByDoctorId(doctorId);
  }

  async cancel(
    appointmentId: string,
    cancelledBy: string,
    dto: CancelAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    appointment.cancel(cancelledBy, dto.reason);
    return await this.appointmentRepo.update(appointmentId, appointment);
  }

  async getAvailableSlots(
    doctorId: string,
    serviceId: string,
    date: string,
  ): Promise<string[]> {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const startHour = 8;
    const endHour = 17;
    const slotDuration = 30;

    const allSlots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += slotDuration) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        allSlots.push(timeSlot);
      }
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await this.appointmentRepo.findByDateRange(
      doctorId,
      startOfDay,
      endOfDay,
    );

    const bookedSlots = existingAppointments.map((apt) => apt.timeSlot);

    const availableSlots = allSlots.filter(
      (slot) => !bookedSlots.includes(slot),
    );

    return availableSlots;
  }
}
