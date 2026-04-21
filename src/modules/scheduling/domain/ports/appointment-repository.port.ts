import { Appointment } from '../entities/appointment.entity';

export const APPOINTMENT_REPOSITORY = Symbol('APPOINTMENT_REPOSITORY');

export interface AppointmentRepository {
  save(appointment: Appointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findByPatientId(patientId: string): Promise<Appointment[]>;
  findByDoctorId(doctorId: string): Promise<Appointment[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  findConflicting(doctorId: string, scheduledAt: Date, durationMinutes: number): Promise<Appointment | null>;
  delete(id: string): Promise<void>;
  update(appointment: Appointment): Promise<Appointment>;
}