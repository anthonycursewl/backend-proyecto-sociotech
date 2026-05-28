export interface DoctorScheduleData {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface DoctorProps {
  id: string;
  userId: string;
  specialty: string;
  licenseNumber: string;
  consultationPrice?: number;
  biography?: string;
  phoneNumber?: string;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  schedules?: DoctorScheduleData[];
  createdAt: Date;
  updatedAt: Date;
}

export class Doctor {
  private readonly props: DoctorProps;

  constructor(props: DoctorProps) {
    this.props = props;
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get specialty(): string { return this.props.specialty; }
  get licenseNumber(): string { return this.props.licenseNumber; }
  get consultationPrice(): number | undefined { return this.props.consultationPrice; }
  get biography(): string | undefined { return this.props.biography; }
  get phoneNumber(): string | undefined { return this.props.phoneNumber; }
  get isActive(): boolean { return this.props.isActive; }
  get firstName(): string | undefined { return this.props.firstName; }
  get lastName(): string | undefined { return this.props.lastName; }
  get email(): string | undefined { return this.props.email; }
  get schedules(): DoctorScheduleData[] | undefined { return this.props.schedules; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  update(data: Partial<DoctorProps>): void {
    if (data.specialty !== undefined) this.props.specialty = data.specialty;
    if (data.licenseNumber !== undefined)
      this.props.licenseNumber = data.licenseNumber;
    if (data.consultationPrice !== undefined)
      this.props.consultationPrice = data.consultationPrice;
    if (data.biography !== undefined) this.props.biography = data.biography;
    if (data.phoneNumber !== undefined)
      this.props.phoneNumber = data.phoneNumber;
    if (data.isActive !== undefined) this.props.isActive = data.isActive;
    this.props.updatedAt = new Date();
  }

  toPlain(): DoctorProps {
    return {
      id: this.id,
      userId: this.userId,
      specialty: this.specialty,
      licenseNumber: this.licenseNumber,
      consultationPrice: this.consultationPrice,
      biography: this.biography,
      phoneNumber: this.phoneNumber,
      isActive: this.isActive,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      schedules: this.schedules,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      specialty: this.specialty,
      licenseNumber: this.licenseNumber,
      consultationPrice: this.consultationPrice,
      biography: this.biography,
      phoneNumber: this.phoneNumber,
      isActive: this.isActive,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      schedules: this.schedules,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
