import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  APPOINTMENT_REPOSITORY,
  AppointmentRepository,
} from '../../domain/repositories/appointment-repository.port';
import {
  Appointment,
  AppointmentStatus,
} from '../../domain/entities/appointment.entity';
import { AppointmentsPrismaService } from '../db/prisma.service';

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(
    @Inject(AppointmentsPrismaService)
    private readonly prisma: AppointmentsPrismaService,
  ) {}

  private toDomain(p: any): Appointment {
    return new Appointment({
      id: p.id,
      patientId: p.patientId,
      doctorId: p.doctorId,
      serviceId: p.serviceId,
      scheduledAt: p.scheduledAt,
      timeSlot: p.timeSlot,
      durationMinutes: p.durationMinutes,
      status: p.status as AppointmentStatus,
      reason: p.reason,
      notes: p.notes,
      cancelledAt: p.cancelledAt,
      cancelledBy: p.cancelledBy,
      cancellationReason: p.cancellationReason,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }

  async save(appointment: Appointment): Promise<Appointment> {
    const p = await this.prisma.appointment.create({
      data: {
        id: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        serviceId: appointment.serviceId,
        scheduledAt: appointment.scheduledAt,
        timeSlot: appointment.timeSlot,
        durationMinutes: appointment.durationMinutes,
        status: appointment.status,
        reason: appointment.reason,
        notes: appointment.notes,
        cancelledAt: appointment.cancelledAt,
        cancelledBy: appointment.cancelledBy,
        cancellationReason: appointment.cancellationReason,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      },
    });
    return this.toDomain(p);
  }

  async findById(id: string): Promise<Appointment | null> {
    const p = await this.prisma.appointment.findUnique({ where: { id } });
    return p ? this.toDomain(p) : null;
  }

  async findAll(): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      orderBy: { scheduledAt: 'desc' },
    });
    return appointments.map((a) => this.toDomain(a));
  }

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { scheduledAt: 'desc' },
    });
    return appointments.map((a) => this.toDomain(a));
  }

  async findByDoctorId(doctorId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { doctorId },
      orderBy: { scheduledAt: 'desc' },
    });
    return appointments.map((a) => this.toDomain(a));
  }

  async findByDateRange(
    doctorId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return appointments.map((a) => this.toDomain(a));
  }

  async findConflicting(
    doctorId: string,
    date: Date,
    timeSlot: string,
    durationMinutes: number,
  ): Promise<Appointment | null> {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: {
          gte: startTime,
          lt: endTime,
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
      },
    });

    return appointments.length > 0 ? this.toDomain(appointments[0]) : null;
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.cancelledAt !== undefined)
      updateData.cancelledAt = data.cancelledAt;
    if (data.cancelledBy !== undefined)
      updateData.cancelledBy = data.cancelledBy;
    if (data.cancellationReason !== undefined)
      updateData.cancellationReason = data.cancellationReason;
    updateData.updatedAt = new Date();

    const p = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
    });
    return this.toDomain(p);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appointment.delete({ where: { id } });
  }
}
