import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DOCTOR_SCHEDULE_REPOSITORY } from '@clinical/domain/repositories/doctor-schedule-repository.port';
import { DOCTOR_REPOSITORY } from '@clinical/domain/repositories/doctor-repository.port';
import { DoctorSchedule } from '@clinical/domain/entities/doctor-schedule.entity';
import {
  CreateDoctorScheduleDto,
  UpdateDoctorScheduleDto,
} from '@clinical/presentation/controllers/doctor-schedule.dto';

@Injectable()
export class DoctorScheduleService {
  private readonly logger = new Logger(DoctorScheduleService.name);

  constructor(
    @Inject(DOCTOR_SCHEDULE_REPOSITORY) private readonly scheduleRepo: any,
    @Inject(DOCTOR_REPOSITORY) private readonly doctorRepo: any,
  ) {}

  async createSchedule(
    doctorId: string,
    dto: CreateDoctorScheduleDto,
  ): Promise<DoctorSchedule> {
    const doctor = await this.doctorRepo.findById(doctorId);
    if (!doctor) {
      throw new ForbiddenException('Doctor not found');
    }

    const existing = await this.scheduleRepo.findByDoctorIdAndDay(
      doctorId,
      dto.dayOfWeek,
    );
    if (existing) {
      throw new ForbiddenException(
        `Schedule already exists for day ${dto.dayOfWeek}`,
      );
    }

    const schedule = new DoctorSchedule({
      id: crypto.randomUUID(),
      doctorId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      isActive: dto.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.scheduleRepo.save(schedule);
  }

  async findById(scheduleId: string): Promise<DoctorSchedule> {
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }
    return schedule;
  }

  async getSchedulesByDoctor(doctorId: string): Promise<DoctorSchedule[]> {
    const doctor = await this.doctorRepo.findById(doctorId);
    if (!doctor) {
      throw new ForbiddenException('Doctor not found');
    }

    return await this.scheduleRepo.findByDoctorId(doctorId);
  }

  async updateSchedule(
    scheduleId: string,
    dto: UpdateDoctorScheduleDto,
  ): Promise<DoctorSchedule> {
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) {
      throw new ForbiddenException('Schedule not found');
    }

    schedule.update({
      startTime: dto.startTime,
      endTime: dto.endTime,
      isActive: dto.isActive,
    });

    return await this.scheduleRepo.update(scheduleId, schedule);
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) {
      throw new ForbiddenException('Schedule not found');
    }

    await this.scheduleRepo.delete(scheduleId);
  }
}
