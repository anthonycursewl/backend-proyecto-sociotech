export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface AppointmentProps {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string;
  notes: string;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Appointment {
  private readonly props: AppointmentProps;

  constructor(props: AppointmentProps) {
    this.props = props;
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

  get scheduledAt(): Date {
    return this.props.scheduledAt;
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

  get notes(): string {
    return this.props.notes;
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  get cancelledBy(): string | null {
    return this.props.cancelledBy;
  }

  get cancellationReason(): string | null {
    return this.props.cancellationReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get endTime(): Date {
    return new Date(this.props.scheduledAt.getTime() + this.props.durationMinutes * 60000);
  }

  confirm(): void {
    if (this.props.status !== AppointmentStatus.SCHEDULED) {
      throw new Error('Cannot confirm appointment that is not in SCHEDULED status');
    }
    this.props.status = AppointmentStatus.CONFIRMED;
    this.props.updatedAt = new Date();
  }

  start(): void {
    if (this.props.status !== AppointmentStatus.CONFIRMED) {
      throw new Error('Cannot start appointment that is not CONFIRMED');
    }
    this.props.status = AppointmentStatus.IN_PROGRESS;
    this.props.updatedAt = new Date();
  }

  complete(): void {
    if (this.props.status !== AppointmentStatus.IN_PROGRESS) {
      throw new Error('Cannot complete appointment that is not IN_PROGRESS');
    }
    this.props.status = AppointmentStatus.COMPLETED;
    this.props.updatedAt = new Date();
  }

  cancel(cancelledBy: string, reason: string): void {
    if (
      this.props.status === AppointmentStatus.COMPLETED ||
      this.props.status === AppointmentStatus.CANCELLED
    ) {
      throw new Error('Cannot cancel appointment that is already completed or cancelled');
    }
    this.props.status = AppointmentStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.cancelledBy = cancelledBy;
    this.props.cancellationReason = reason;
    this.props.updatedAt = new Date();
  }

  reschedule(newScheduledAt: Date): void {
    if (
      this.props.status === AppointmentStatus.COMPLETED ||
      this.props.status === AppointmentStatus.CANCELLED
    ) {
      throw new Error('Cannot reschedule appointment that is already completed or cancelled');
    }
    this.props.scheduledAt = newScheduledAt;
    this.props.updatedAt = new Date();
  }

  markNoShow(): void {
    if (
      this.props.status === AppointmentStatus.COMPLETED ||
      this.props.status === AppointmentStatus.CANCELLED
    ) {
      throw new Error('Cannot mark as no-show an appointment that is already completed or cancelled');
    }
    this.props.status = AppointmentStatus.NO_SHOW;
    this.props.updatedAt = new Date();
  }

  toPlain(): AppointmentProps {
    return { ...this.props };
  }
}