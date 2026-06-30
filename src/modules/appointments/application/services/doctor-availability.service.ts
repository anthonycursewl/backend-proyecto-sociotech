import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { DoctorScheduleService } from '../../../clinical/application/services/doctor-schedule.service';
import { ServiceService } from '../../../services/application/services/service.service';
import { DoctorService } from '../../../clinical/application/services/doctor.service';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment-repository.port';
import type { AppointmentRepository } from '../../domain/repositories/appointment-repository.port';
import { SLOT_DURATION } from '@shared/constants';
import {
  getLocalParts,
  fromLocalWallClock,
  getLocalDayUtcRange,
} from '@shared/utils/timezone.util';

export interface MonthDayAvailability {
  date: string;
  availableSlots: number;
}

@Injectable()
export class DoctorAvailabilityService {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly scheduleService: DoctorScheduleService,
    private readonly serviceService: ServiceService,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepo: AppointmentRepository,
  ) {}

  /**
   * Returns the available local-time slots ("HH:mm") for a doctor on a given
   * local date. The frontend displays these directly to the user.
   */
  async getAvailableSlots(
    doctorId: string,
    serviceId: string,
    localDate: string,
  ): Promise<string[]> {
    const { year, month, day, dayOfWeek, schedule } = await this.loadContext(
      doctorId,
      serviceId,
      localDate,
    );

    if (!schedule) return [];

    const duration = await this.getServiceDuration(serviceId);
    const slots = this.buildLocalSlots(schedule, duration);

    const { start, end } = getLocalDayUtcRange(year, month, day);
    const existing = await this.appointmentRepo.findByDateRange(
      doctorId,
      start,
      end,
    );

    const occupied = this.computeOccupiedSlots(existing, slots, duration);
    return slots.filter((s) => !occupied.has(s));
  }

  /**
   * Validates a UTC scheduledAt against the doctor's schedule for the local
   * day it falls on. Throws BadRequestException with a clear message otherwise.
   */
  async validateSlot(
    doctorId: string,
    serviceId: string,
    utcScheduledAt: Date,
  ): Promise<void> {
    const local = getLocalParts(utcScheduledAt);
    const localDate = `${local.year}-${String(local.month).padStart(2, '0')}-${String(local.day).padStart(2, '0')}`;

    const { schedule } = await this.loadContext(doctorId, serviceId, localDate);

    if (!schedule) {
      throw new BadRequestException('El doctor no está disponible en este día');
    }

    const [sh, sm] = schedule.startTime.split(':').map(Number);
    const [eh, em] = schedule.endTime.split(':').map(Number);
    const scheduleStartMin = sh * 60 + sm;
    const scheduleEndMin = eh * 60 + em;
    const slotMin = local.hour * 60 + local.minute;

    if (slotMin < scheduleStartMin || slotMin >= scheduleEndMin) {
      throw new BadRequestException(
        'El horario seleccionado está fuera del horario laboral del doctor',
      );
    }

    const duration = await this.getServiceDuration(serviceId);
    if (slotMin + duration > scheduleEndMin) {
      throw new BadRequestException(
        'La duración de la cita excede el tiempo disponible antes del cierre del turno',
      );
    }
  }

  /**
   * Returns, for each day in a month, the count of available local slots.
   */
  async getMonthAvailability(
    doctorId: string,
    serviceId: string,
    year: number,
    month: number,
  ): Promise<MonthDayAvailability[]> {
    await this.loadDoctorAndService(doctorId, serviceId);
    const schedules = await this.scheduleService.getSchedulesByDoctor(doctorId);
    const duration = await this.getServiceDuration(serviceId);

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = fromLocalWallClock(year, month, 1, 0, 0);
    const monthEnd = fromLocalWallClock(year, month, daysInMonth, 23, 59, 59);
    const allAppointments = await this.appointmentRepo.findByDateRange(
      doctorId,
      monthStart,
      monthEnd,
    );

    const result: MonthDayAvailability[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const localNoon = fromLocalWallClock(year, month, day, 12, 0);
      const dow = getLocalParts(localNoon).dayOfWeek;
      const schedule = schedules.find((s) => s.dayOfWeek === dow && s.isActive);

      if (!schedule) {
        result.push({
          date: this.formatLocalDate(year, month, day),
          availableSlots: 0,
        });
        continue;
      }

      const slots = this.buildLocalSlots(schedule, duration);
      const { start, end } = getLocalDayUtcRange(year, month, day);
      const dayAppointments = allAppointments.filter(
        (a) => a.scheduledAt >= start && a.scheduledAt < end,
      );
      const occupied = this.computeOccupiedSlots(
        dayAppointments,
        slots,
        duration,
      );
      result.push({
        date: this.formatLocalDate(year, month, day),
        availableSlots: slots.length - occupied.size,
      });
    }

    return result;
  }

  private async loadContext(
    doctorId: string,
    serviceId: string,
    localDate: string,
  ) {
    await this.loadDoctorAndService(doctorId, serviceId);
    const [year, month, day] = localDate.split('-').map(Number);
    const localNoon = fromLocalWallClock(year, month, day, 12, 0);
    const dayOfWeek = getLocalParts(localNoon).dayOfWeek;
    const schedules = await this.scheduleService.getSchedulesByDoctor(doctorId);
    const schedule = schedules.find(
      (s) => s.dayOfWeek === dayOfWeek && s.isActive,
    );
    return { year, month, day, dayOfWeek, schedule };
  }

  private async loadDoctorAndService(doctorId: string, serviceId: string) {
    const doctor = await this.doctorService.findById(doctorId);
    if (!doctor.isActive) {
      throw new BadRequestException('Este doctor no está disponible actualmente');
    }
    const service = await this.serviceService.findById(serviceId);
    if (!service) {
      throw new BadRequestException('Servicio no encontrado');
    }
    const doctorServices = await this.serviceService.findByDoctor(doctorId, undefined, 1000);
    if (!doctorServices.data.some((s) => s.id === serviceId)) {
      throw new BadRequestException(
        'Este doctor no ofrece el servicio solicitado',
      );
    }
  }

  private async getServiceDuration(serviceId: string): Promise<number> {
    const service = await this.serviceService.findById(serviceId);
    return service.durationMin;
  }

  async getDurationFor(serviceId: string): Promise<number> {
    return this.getServiceDuration(serviceId);
  }

  private buildLocalSlots(
    schedule: { startTime: string; endTime: string },
    duration: number,
  ): string[] {
    const [sh, sm] = schedule.startTime.split(':').map(Number);
    const [eh, em] = schedule.endTime.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const slots: string[] = [];
    for (let m = start; m + duration <= end; m += SLOT_DURATION) {
      slots.push(
        `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`,
      );
    }
    return slots;
  }

  private computeOccupiedSlots(
    appointments: Array<{ scheduledAt: Date; durationMinutes: number }>,
    slots: string[],
    newServiceDuration: number,
  ): Set<string> {
    const occupied = new Set<string>();
    for (const apt of appointments) {
      const aptLocal = getLocalParts(apt.scheduledAt);
      const aptStart = aptLocal.hour * 60 + aptLocal.minute;
      const aptEnd = aptStart + apt.durationMinutes;

      for (const slot of slots) {
        const [sh, sm] = slot.split(':').map(Number);
        const sStart = sh * 60 + sm;
        const sEnd = sStart + newServiceDuration;
        if (sStart < aptEnd && sEnd > aptStart) {
          occupied.add(slot);
        }
      }
    }
    return occupied;
  }

  private formatLocalDate(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}
