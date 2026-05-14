import { Appointment, AppointmentStatus } from '../entities/appointment.entity';

export const APPOINTMENT_REPOSITORY = 'APPOINTMENT_REPOSITORY';

export interface AppointmentRepository {
  save(appointment: Appointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findAll(): Promise<Appointment[]>;
  findByPatientId(patientId: string): Promise<Appointment[]>;
  findByDoctorId(doctorId: string): Promise<Appointment[]>;
  findByDateRange(
    doctorId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]>;
  findConflicting(
    doctorId: string,
    date: Date,
    timeSlot: string,
    durationMinutes: number,
  ): Promise<Appointment | null>;
  update(id: string, data: Partial<Appointment>): Promise<Appointment>;
  delete(id: string): Promise<void>;
}
