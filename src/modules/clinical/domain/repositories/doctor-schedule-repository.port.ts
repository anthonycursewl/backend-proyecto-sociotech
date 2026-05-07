import { DoctorSchedule } from '@clinical/domain/entities/doctor-schedule.entity';

export const DOCTOR_SCHEDULE_REPOSITORY = 'DOCTOR_SCHEDULE_REPOSITORY';

export interface DoctorScheduleRepository {
  findByDoctorId(doctorId: string): Promise<DoctorSchedule[]>;
  findByDoctorIdAndDay(doctorId: string, dayOfWeek: number): Promise<DoctorSchedule | null>;
  findById(id: string): Promise<DoctorSchedule | null>;
  save(schedule: DoctorSchedule): Promise<DoctorSchedule>;
  update(id: string, schedule: DoctorSchedule): Promise<DoctorSchedule>;
  delete(id: string): Promise<void>;
}