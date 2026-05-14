export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface AppointmentProps {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  scheduledAt: Date;
  timeSlot: string;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
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
    return this.props.timeSlot;
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
  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }
  get cancelledBy(): string | undefined {
    return this.props.cancelledBy;
  }
  get cancellationReason(): string | undefined {
    return this.props.cancellationReason;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  cancel(cancelledBy: string, reason?: string) {
    this.props.status = AppointmentStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.cancelledBy = cancelledBy;
    this.props.cancellationReason = reason;
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
}
