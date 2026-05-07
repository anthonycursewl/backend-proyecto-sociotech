export interface PatientProps {
  id: string;
  userId: string;
  medicalId: string;
  dateOfBirth: Date;
  gender?: string;
  occupation?: string;
  civilStatus?: string;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType?: string;
  allergies: string[];
  currentMedications: string[];
  chronicDiseases: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Patient {
  private readonly props: PatientProps;

  constructor(props: PatientProps) {
    this.props = { ...props };
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get medicalId(): string { return this.props.medicalId; }
  get dateOfBirth(): Date { return this.props.dateOfBirth; }
  get gender(): string | undefined { return this.props.gender; }
  get occupation(): string | undefined { return this.props.occupation; }
  get civilStatus(): string | undefined { return this.props.civilStatus; }
  get phone(): string { return this.props.phone; }
  get address(): string { return this.props.address; }
  get emergencyContact(): string { return this.props.emergencyContact; }
  get emergencyPhone(): string { return this.props.emergencyPhone; }
  get bloodType(): string | undefined { return this.props.bloodType; }
  get allergies(): string[] { return this.props.allergies; }
  get currentMedications(): string[] { return this.props.currentMedications; }
  get chronicDiseases(): string[] { return this.props.chronicDiseases; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  update(data: Partial<PatientProps>) {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
  }
}