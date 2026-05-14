export interface PatientProps {
  id: string;
  userId: string;
  medicalId: string;
  cedula?: string | null;
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
  get cedula(): string | null | undefined { return this.props.cedula; }
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

  toPlain(): PatientProps {
    return {
      id: this.id,
      userId: this.userId,
      medicalId: this.medicalId,
      cedula: this.cedula,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      occupation: this.occupation,
      civilStatus: this.civilStatus,
      phone: this.phone,
      address: this.address,
      emergencyContact: this.emergencyContact,
      emergencyPhone: this.emergencyPhone,
      bloodType: this.bloodType,
      allergies: this.allergies,
      currentMedications: this.currentMedications,
      chronicDiseases: this.chronicDiseases,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  update(data: Partial<PatientProps>) {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
  }
}