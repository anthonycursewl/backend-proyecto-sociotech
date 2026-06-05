import { getLocalParts } from '@shared/utils/timezone.util';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface AppointmentCancellationData {
  cancelledAt: Date;
  cancelledBy: string;
  cancellationReason: string | null;
}

export interface AppointmentDoctorData {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  phoneNumber: string | null;
}

export interface AppointmentServiceData {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number | null;
}

export interface AppointmentPatientData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  medicalId: string;
  cedula: string | null;
}

export interface AppointmentProps {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  cancellation?: AppointmentCancellationData | null;
  doctor?: AppointmentDoctorData | null;
  service?: AppointmentServiceData | null;
  patient?: AppointmentPatientData | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Appointment {
  private readonly props: AppointmentProps;

  constructor(props: AppointmentProps) {
    this.props = { ...props };
  }

  get id(): string {
    return this.props.id;
  }
  get patientId(): string {
    return this.props.patientId;
  }
  get doctorId(): string {
    return this.props.doctorId;
  }
  get serviceId(): string {
    return this.props.serviceId;
  }
  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }
  get timeSlot(): string {
    const local = getLocalParts(this.props.scheduledAt);
    return `${String(local.hour).padStart(2, '0')}:${String(local.minute).padStart(2, '0')}`;
  }
  get durationMinutes(): number {
    return this.props.durationMinutes;
  }
  get status(): AppointmentStatus {
    return this.props.status;
  }
  get reason(): string {
    return this.props.reason;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get cancellation(): AppointmentCancellationData | null | undefined {
    return this.props.cancellation;
  }
  get cancelledAt(): Date | undefined {
    return this.props.cancellation?.cancelledAt;
  }
  get cancelledBy(): string | undefined {
    return this.props.cancellation?.cancelledBy;
  }
  get cancellationReason(): string | undefined {
    return this.props.cancellation?.cancellationReason ?? undefined;
  }
  get doctor(): AppointmentDoctorData | null | undefined {
    return this.props.doctor;
  }
  get service(): AppointmentServiceData | null | undefined {
    return this.props.service;
  }
  get patient(): AppointmentPatientData | null | undefined {
    return this.props.patient;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  cancel(cancelledBy: string, reason?: string) {
    this.props.status = AppointmentStatus.CANCELLED;
    this.props.cancellation = {
      cancelledAt: new Date(),
      cancelledBy,
      cancellationReason: reason ?? null,
    };
    this.props.updatedAt = new Date();
  }

  confirm() {
    this.props.status = AppointmentStatus.CONFIRMED;
    this.props.updatedAt = new Date();
  }

  complete() {
    this.props.status = AppointmentStatus.COMPLETED;
    this.props.updatedAt = new Date();
  }

  markNoShow() {
    this.props.status = AppointmentStatus.NO_SHOW;
    this.props.updatedAt = new Date();
  }

  reschedule(scheduledAt: Date, durationMinutes: number) {
    this.props.scheduledAt = scheduledAt;
    this.props.durationMinutes = durationMinutes;
    this.props.status = AppointmentStatus.SCHEDULED;
    this.props.updatedAt = new Date();
  }
}
