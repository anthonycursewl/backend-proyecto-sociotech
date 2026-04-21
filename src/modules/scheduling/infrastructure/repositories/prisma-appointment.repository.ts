import { Injectable } from '@nestjs/common';
import { Appointment, AppointmentStatus } from '@scheduling/domain/entities/appointment.entity';
import { AppointmentRepository } from '@scheduling/domain/ports/appointment-repository.port';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) { }

  private toDomain(prismaAppointment: any): Appointment {
    return new Appointment({
      id: prismaAppointment.id,
      patientId: prismaAppointment.patientId,
      doctorId: prismaAppointment.doctorId,
      scheduledAt: prismaAppointment.scheduledAt,
      durationMinutes: prismaAppointment.durationMinutes,
      status: prismaAppointment.status as AppointmentStatus,
      reason: prismaAppointment.reason,
      notes: prismaAppointment.notes || '',
      cancelledAt: prismaAppointment.cancelledAt,
      cancelledBy: prismaAppointment.cancelledBy,
      cancellationReason: prismaAppointment.cancellationReason,
      createdAt: prismaAppointment.createdAt,
      updatedAt: prismaAppointment.updatedAt,
    });
  }

  async save(appointment: Appointment): Promise<Appointment> {
    const prismaAppointment = await this.prisma.appointment.create({
      data: {
        id: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        scheduledAt: appointment.scheduledAt,
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
    return this.toDomain(prismaAppointment);
  }

  async findById(id: string): Promise<Appointment | null> {
    const prismaAppointment = await this.prisma.appointment.findUnique({ where: { id } });
    return prismaAppointment ? this.toDomain(prismaAppointment) : null;
  }

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    const prismaAppointments = await this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { scheduledAt: 'desc' },
    });
    return prismaAppointments.map((a) => this.toDomain(a));
  }

  async findByDoctorId(doctorId: string): Promise<Appointment[]> {
    const prismaAppointments = await this.prisma.appointment.findMany({
      where: { doctorId },
      orderBy: { scheduledAt: 'asc' },
    });
    return prismaAppointments.map((a) => this.toDomain(a));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    const prismaAppointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return prismaAppointments.map((a) => this.toDomain(a));
  }

  async findConflicting(doctorId: string, scheduledAt: Date, durationMinutes: number): Promise<Appointment | null> {
    const startTime = new Date(scheduledAt);
    const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);

    const conflicting = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        OR: [
          {
            scheduledAt: {
              lt: endTime,
            },
          },
          {
            AND: [
              { scheduledAt: { gte: startTime } },
              { scheduledAt: { lt: endTime } },
            ],
          },
        ],
      },
    });

    return conflicting ? this.toDomain(conflicting) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appointment.delete({ where: { id } });
  }

  async update(appointment: Appointment): Promise<Appointment> {
    const prismaAppointment = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        scheduledAt: appointment.scheduledAt,
        durationMinutes: appointment.durationMinutes,
        status: appointment.status,
        reason: appointment.reason,
        notes: appointment.notes,
        cancelledAt: appointment.cancelledAt,
        cancelledBy: appointment.cancelledBy,
        cancellationReason: appointment.cancellationReason,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(prismaAppointment);
  }
}