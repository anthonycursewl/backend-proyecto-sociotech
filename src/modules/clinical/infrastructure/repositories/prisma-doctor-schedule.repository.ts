import { Injectable } from '@nestjs/common';
import { PrismaService } from '@clinical/infrastructure/db/prisma.service';
import {
  DOCTOR_SCHEDULE_REPOSITORY,
  DoctorScheduleRepository,
} from '@clinical/domain/repositories/doctor-schedule-repository.port';
import { DoctorSchedule } from '@clinical/domain/entities/doctor-schedule.entity';

@Injectable()
export class PrismaDoctorScheduleRepository implements DoctorScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDoctorId(doctorId: string): Promise<DoctorSchedule[]> {
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });
    return schedules.map((s) => new DoctorSchedule(s));
  }

  async findByDoctorIdAndDay(
    doctorId: string,
    dayOfWeek: number,
  ): Promise<DoctorSchedule | null> {
    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: {
        doctorId_dayOfWeek: { doctorId, dayOfWeek },
      },
    });
    return schedule ? new DoctorSchedule(schedule) : null;
  }

  async findById(id: string): Promise<DoctorSchedule | null> {
    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { id },
    });
    return schedule ? new DoctorSchedule(schedule) : null;
  }

  async save(schedule: DoctorSchedule): Promise<DoctorSchedule> {
    const saved = await this.prisma.doctorSchedule.create({
      data: {
        id: schedule.id,
        doctorId: schedule.doctorId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive: schedule.isActive,
      },
    });
    return new DoctorSchedule(saved);
  }

  async update(id: string, schedule: DoctorSchedule): Promise<DoctorSchedule> {
    const updated = await this.prisma.doctorSchedule.update({
      where: { id },
      data: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive: schedule.isActive,
      },
    });
    return new DoctorSchedule(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.doctorSchedule.delete({
      where: { id },
    });
  }
}
