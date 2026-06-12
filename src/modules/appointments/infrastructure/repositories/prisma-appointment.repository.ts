import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  APPOINTMENT_REPOSITORY,
  AppointmentFilter,
  AppointmentRepository,
} from '../../domain/repositories/appointment-repository.port';
import {
  Appointment,
  AppointmentStatus,
} from '../../domain/entities/appointment.entity';
import { AppointmentsPrismaService } from '../db/prisma.service';

type AppointmentDoctorRow = {
  id: string;
  specialty: string;
  phoneNumber: string | null;
  user: { firstName: string; lastName: string };
};

type AppointmentServiceRow = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number | null;
};

type AppointmentPatientRow = {
  id: string;
  userId: string;
  medicalId: string;
  cedula: string | null;
  phone: string;
  user: { firstName: string; lastName: string; email: string };
};

type AppointmentServiceMinimal = {
  durationMin: number;
};

type AppointmentWithRelations = {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  scheduledAt: Date;
  status: string;
  reason: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  doctor?: AppointmentDoctorRow | null;
  service?: AppointmentServiceRow | null;
  patient?: AppointmentPatientRow | null;
  cancellation?: {
    cancelledAt: Date;
    cancelledBy: string;
    cancellationReason: string | null;
  } | null;
};

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(
    @Inject(AppointmentsPrismaService)
    private readonly prisma: AppointmentsPrismaService,
  ) {}

  private toDomain(p: AppointmentWithRelations): Appointment {
    return new Appointment({
      id: p.id,
      patientId: p.patientId,
      doctorId: p.doctorId,
      serviceId: p.serviceId,
      scheduledAt: p.scheduledAt,
      durationMinutes: p.service?.durationMin ?? 0,
      status: p.status as AppointmentStatus,
      reason: p.reason,
      notes: p.notes ?? undefined,
      cancellation: p.cancellation
        ? {
            cancelledAt: p.cancellation.cancelledAt,
            cancelledBy: p.cancellation.cancelledBy,
            cancellationReason: p.cancellation.cancellationReason,
          }
        : null,
      doctor: p.doctor
        ? {
            id: p.doctor.id,
            firstName: p.doctor.user.firstName,
            lastName: p.doctor.user.lastName,
            specialty: p.doctor.specialty,
            phoneNumber: p.doctor.phoneNumber,
          }
        : null,
      service: p.service
        ? {
            id: p.service.id,
            name: p.service.name,
            description: p.service.description,
            durationMin: p.service.durationMin,
            price: p.service.price,
          }
        : null,
      patient: p.patient
        ? {
            id: p.patient.id,
            userId: p.patient.userId,
            firstName: p.patient.user.firstName,
            lastName: p.patient.user.lastName,
            fullName:
              `${p.patient.user.firstName} ${p.patient.user.lastName}`.trim(),
            email: p.patient.user.email,
            phone: p.patient.phone,
            medicalId: p.patient.medicalId,
            cedula: p.patient.cedula,
          }
        : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }

  private toDomainMinimal(p: {
    id: string;
    patientId: string;
    doctorId: string;
    serviceId: string;
    scheduledAt: Date;
    status: string;
    reason: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    service: AppointmentServiceMinimal | null;
  }): Appointment {
    return new Appointment({
      id: p.id,
      patientId: p.patientId,
      doctorId: p.doctorId,
      serviceId: p.serviceId,
      scheduledAt: p.scheduledAt,
      durationMinutes: p.service?.durationMin ?? 0,
      status: p.status as AppointmentStatus,
      reason: p.reason,
      notes: p.notes ?? undefined,
      cancellation: null,
      doctor: null,
      service: null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }

  private defaultInclude() {
    return {
      cancellation: {
        select: {
          cancelledAt: true,
          cancelledBy: true,
          cancellationReason: true,
        },
      },
      doctor: {
        select: {
          id: true,
          specialty: true,
          phoneNumber: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          durationMin: true,
          price: true,
        },
      },
      patient: {
        select: {
          id: true,
          userId: true,
          medicalId: true,
          cedula: true,
          phone: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    };
  }

  private internalInclude() {
    return {
      service: { select: { durationMin: true } },
    };
  }

  async save(appointment: Appointment): Promise<Appointment> {
    const p = await this.prisma.appointment.create({
      data: {
        id: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        serviceId: appointment.serviceId,
        scheduledAt: appointment.scheduledAt,
        status: appointment.status,
        reason: appointment.reason,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      },
      include: this.defaultInclude(),
    });
    return this.toDomain(p);
  }

  async findById(id: string): Promise<Appointment | null> {
    const p = await this.prisma.appointment.findUnique({
      where: { id },
      include: this.defaultInclude(),
    });
    return p ? this.toDomain(p) : null;
  }

  async findAll(filter?: AppointmentFilter): Promise<Appointment[]> {
    const where: {
      status?: { in: AppointmentStatus[] };
      scheduledAt?: { gte?: Date; lt?: Date };
      doctorId?: string;
    } = {};

    if (filter?.statuses?.length) {
      where.status = { in: filter.statuses };
    }
    if (filter?.scheduledFrom || filter?.scheduledTo) {
      where.scheduledAt = {};
      if (filter.scheduledFrom) where.scheduledAt.gte = filter.scheduledFrom;
      if (filter.scheduledTo) where.scheduledAt.lt = filter.scheduledTo;
    }
    if (filter?.doctorId) {
      where.doctorId = filter.doctorId;
    }

    const appointments = await this.prisma.appointment.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { scheduledAt: 'desc' },
      include: this.defaultInclude(),
    });
    return appointments.map((a) =>
      this.toDomain(a as AppointmentWithRelations),
    );
  }

  async findByPatientId(
    patientId: string,
    filter?: AppointmentFilter,
  ): Promise<Appointment[]> {
    const where: {
      patientId: string;
      status?: { in: AppointmentStatus[] };
      scheduledAt?: { gte?: Date; lt?: Date };
    } = { patientId };

    if (filter?.statuses?.length) {
      where.status = { in: filter.statuses };
    }
    if (filter?.scheduledFrom || filter?.scheduledTo) {
      where.scheduledAt = {};
      if (filter.scheduledFrom) where.scheduledAt.gte = filter.scheduledFrom;
      if (filter.scheduledTo) where.scheduledAt.lt = filter.scheduledTo;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: this.defaultInclude(),
    });
    return appointments.map((a) =>
      this.toDomain(a as AppointmentWithRelations),
    );
  }

  async findByDoctorId(doctorId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { doctorId },
      orderBy: { scheduledAt: 'desc' },
      include: this.defaultInclude(),
    });
    return appointments.map((a) =>
      this.toDomain(a as AppointmentWithRelations),
    );
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
      include: this.internalInclude(),
    });
    return appointments.map((a) => this.toDomainMinimal(a));
  }

  async findConflicting(
    doctorId: string,
    scheduledAt: Date,
    durationMinutes: number,
  ): Promise<Appointment | null> {
    const endTime = new Date(scheduledAt);
    endTime.setUTCMinutes(endTime.getUTCMinutes() + durationMinutes);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: {
          gte: scheduledAt,
          lt: endTime,
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
      },
      include: this.internalInclude(),
    });

    return appointments.length > 0
      ? this.toDomainMinimal(appointments[0])
      : null;
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
      include: { cancellation: { select: { appointmentId: true } } },
    });
    if (!existing) {
      throw new Error(`Appointment ${id} not found`);
    }

    const wasCancelled = existing.cancellation !== null;
    const wantsCancel = data.status === AppointmentStatus.CANCELLED;

    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.scheduledAt !== undefined)
      updateData.scheduledAt = data.scheduledAt;
    updateData.updatedAt = new Date();

    if (wantsCancel && !wasCancelled && data.cancellation) {
      await this.prisma.appointmentCancellation.create({
        data: {
          appointmentId: id,
          cancelledBy: data.cancellation.cancelledBy,
          cancellationReason: data.cancellation.cancellationReason,
          cancelledAt: data.cancellation.cancelledAt,
        },
      });
    } else if (!wantsCancel && wasCancelled) {
      await this.prisma.appointmentCancellation.delete({
        where: { appointmentId: id },
      });
    }

    const p = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: this.defaultInclude(),
    });
    return this.toDomain(p);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appointment.delete({ where: { id } });
  }
}
