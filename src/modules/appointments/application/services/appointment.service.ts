import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment-repository.port';
import type {
  AppointmentFilter,
  AppointmentRepository,
} from '../../domain/repositories/appointment-repository.port';
import {
  Appointment,
  AppointmentStatus,
} from '../../domain/entities/appointment.entity';
import {
  CreateAppointmentDto,
  CancelAppointmentDto,
  MyAppointmentsFilter,
  AllAppointmentsFilter,
} from '../../presentation/controllers/appointment.dto';
import { PatientService } from '../../../patient/application/services/patient.service';
import { DoctorService } from '../../../clinical/application/services/doctor.service';
import { DoctorAvailabilityService } from './doctor-availability.service';

@Injectable()
export class AppointmentService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepo: AppointmentRepository,
    private readonly patientService: PatientService,
    private readonly doctorService: DoctorService,
    private readonly availabilityService: DoctorAvailabilityService,
  ) {}

  async create(
    userId: string,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const patient = await this.patientService.findByUserId(userId);
    if (!patient) {
      throw new ForbiddenException(
        'Patient profile not found. Please register as a patient first.',
      );
    }

    const scheduledDate = new Date(dto.scheduledAt);
    const tomorrow = new Date();
    tomorrow.setUTCHours(0, 0, 0, 0);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    if (scheduledDate < tomorrow) {
      throw new BadRequestException(
        'Appointments can only be scheduled starting from tomorrow',
      );
    }

    await this.availabilityService.validateSlot(
      dto.doctorId,
      dto.serviceId,
      scheduledDate,
    );

    const conflicting = await this.appointmentRepo.findConflicting(
      dto.doctorId,
      scheduledDate,
      await this.availabilityService.getDurationFor(dto.serviceId),
    );
    if (conflicting) {
      throw new BadRequestException('This time slot is already booked');
    }

    const duration = await this.availabilityService.getDurationFor(
      dto.serviceId,
    );

    const appointment = new Appointment({
      id: crypto.randomUUID(),
      patientId: patient.id,
      doctorId: dto.doctorId,
      serviceId: dto.serviceId,
      scheduledAt: scheduledDate,
      durationMinutes: duration,
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

  async getMyAppointments(
    userId: string,
    filter?: MyAppointmentsFilter,
  ): Promise<Appointment[]> {
    const patient = await this.patientService.findByUserId(userId);
    if (!patient) {
      return [];
    }

    const repoFilter = this.buildFilter(filter);
    return await this.appointmentRepo.findByPatientId(patient.id, repoFilter);
  }

  private buildFilter(filter?: MyAppointmentsFilter): AppointmentFilter | undefined {
    if (!filter) return undefined;

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    switch (filter) {
      case MyAppointmentsFilter.PENDING:
        return {
          statuses: [AppointmentStatus.SCHEDULED],
          scheduledFrom: now,
        };
      case MyAppointmentsFilter.UPCOMING:
        return {
          statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          scheduledFrom: now,
          scheduledTo: sevenDaysFromNow,
        };
      case MyAppointmentsFilter.HISTORY:
        return { scheduledTo: now };
    }
  }

  async findAll(
    filter?: AllAppointmentsFilter,
    doctorId?: string,
  ): Promise<Appointment[]> {
    const repoFilter: AppointmentFilter | undefined = {
      ...(filter ? this.buildAllFilter(filter) : {}),
      ...(doctorId ? { doctorId } : {}),
    };
    return await this.appointmentRepo.findAll(
      Object.keys(repoFilter).length > 0 ? repoFilter : undefined,
    );
  }

  async findByDoctorId(doctorId: string): Promise<Appointment[]> {
    return await this.appointmentRepo.findByDoctorId(doctorId);
  }

  private buildAllFilter(
    filter: AllAppointmentsFilter,
  ): AppointmentFilter | undefined {
    const now = new Date();

    switch (filter) {
      case AllAppointmentsFilter.ALL:
        return undefined;
      case AllAppointmentsFilter.UPCOMING:
        return {
          statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          scheduledFrom: now,
        };
      case AllAppointmentsFilter.PENDING:
        return {
          statuses: [AppointmentStatus.SCHEDULED],
        };
      case AllAppointmentsFilter.HISTORY:
        return {
          scheduledTo: now,
        };
    }
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

  async confirmAppointment(
    appointmentId: string,
    userId: string,
  ): Promise<Appointment> {
    const doctor = await this.doctorService.findByUserId(userId);
    if (!doctor) {
      throw new ForbiddenException('Only doctors can confirm appointments');
    }

    const appointment = await this.findById(appointmentId);

    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException('This appointment does not belong to you');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Only scheduled appointments can be confirmed',
      );
    }

    appointment.confirm();
    return await this.appointmentRepo.update(appointmentId, appointment);
  }

  async doctorCancel(
    appointmentId: string,
    userId: string,
    dto: CancelAppointmentDto,
  ): Promise<Appointment> {
    const doctor = await this.doctorService.findByUserId(userId);
    if (!doctor) {
      throw new ForbiddenException('Only doctors can use this endpoint');
    }

    const appointment = await this.findById(appointmentId);

    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException('This appointment does not belong to you');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    appointment.cancel(userId, dto.reason);
    return await this.appointmentRepo.update(appointmentId, appointment);
  }

  async complete(appointmentId: string, userId: string): Promise<Appointment> {
    const doctor = await this.doctorService.findByUserId(userId);
    if (!doctor) {
      throw new ForbiddenException('Only doctors can complete appointments');
    }

    const appointment = await this.findById(appointmentId);

    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException('This appointment does not belong to you');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled appointment');
    }
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Appointment is already completed');
    }
    if (appointment.status === AppointmentStatus.NO_SHOW) {
      throw new BadRequestException(
        'Cannot complete a no-show appointment. Mark as completed from a SCHEDULED or CONFIRMED status.',
      );
    }

    appointment.complete();
    return await this.appointmentRepo.update(appointmentId, appointment);
  }

  async markNoShow(
    appointmentId: string,
    userId: string,
  ): Promise<Appointment> {
    const doctor = await this.doctorService.findByUserId(userId);
    if (!doctor) {
      throw new ForbiddenException('Only doctors can mark no-show');
    }

    const appointment = await this.findById(appointmentId);

    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException('This appointment does not belong to you');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot mark a cancelled appointment as no-show');
    }
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot mark a completed appointment as no-show',
      );
    }
    if (appointment.status === AppointmentStatus.NO_SHOW) {
      throw new BadRequestException('Appointment is already marked as no-show');
    }

    appointment.markNoShow();
    return await this.appointmentRepo.update(appointmentId, appointment);
  }

  async reschedule(
    appointmentId: string,
    userId: string,
    dto: { scheduledAt: string },
  ): Promise<Appointment> {
    const patient = await this.patientService.findByUserId(userId);
    if (!patient) {
      throw new ForbiddenException(
        'Patient profile not found. Please register as a patient first.',
      );
    }

    const appointment = await this.findById(appointmentId);

    if (appointment.patientId !== patient.id) {
      throw new ForbiddenException('This appointment does not belong to you');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot reschedule a cancelled appointment');
    }
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot reschedule a completed appointment');
    }
    if (appointment.status === AppointmentStatus.NO_SHOW) {
      throw new BadRequestException('Cannot reschedule a no-show appointment');
    }

    const newScheduledAt = new Date(dto.scheduledAt);
    if (isNaN(newScheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt date');
    }

    const tomorrow = new Date();
    tomorrow.setUTCHours(0, 0, 0, 0);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    if (newScheduledAt < tomorrow) {
      throw new BadRequestException(
        'Appointments can only be rescheduled starting from tomorrow',
      );
    }

    if (newScheduledAt.getTime() === appointment.scheduledAt.getTime()) {
      throw new BadRequestException(
        'New scheduledAt is the same as the current one',
      );
    }

    await this.availabilityService.validateSlot(
      appointment.doctorId,
      appointment.serviceId,
      newScheduledAt,
    );

    const duration = await this.availabilityService.getDurationFor(
      appointment.serviceId,
    );

    const conflicting = await this.appointmentRepo.findConflicting(
      appointment.doctorId,
      newScheduledAt,
      duration,
    );
    if (conflicting && conflicting.id !== appointmentId) {
      throw new BadRequestException('This time slot is already booked');
    }

    appointment.reschedule(newScheduledAt, duration);
    return await this.appointmentRepo.update(appointmentId, appointment);
  }

  getAvailableSlots(doctorId: string, serviceId: string, date: string) {
    return this.availabilityService.getAvailableSlots(doctorId, serviceId, date);
  }

  getMonthAvailability(
    doctorId: string,
    serviceId: string,
    year: number,
    month: number,
  ) {
    return this.availabilityService.getMonthAvailability(
      doctorId,
      serviceId,
      year,
      month,
    );
  }
}
