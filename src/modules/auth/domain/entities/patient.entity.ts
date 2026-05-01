import { UserRole } from './user.entity';

export interface PatientProps {
  id: string;
  userId: string;
  medicalId: string;
  dateOfBirth: Date;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string | null;
  allergies: string[];
  createdAt: Date;
  updatedAt: Date;
  firstName?: string;
  lastName?: string;
}

export class Patient {
  private readonly props: PatientProps;

  constructor(props: PatientProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get medicalId(): string {
    return this.props.medicalId;
  }

  get dateOfBirth(): Date {
    return this.props.dateOfBirth;
  }

  get phone(): string {
    return this.props.phone;
  }

  get address(): string {
    return this.props.address;
  }

  get emergencyContact(): string {
    return this.props.emergencyContact;
  }

  get emergencyPhone(): string {
    return this.props.emergencyPhone;
  }

  get bloodType(): string | null {
    return this.props.bloodType;
  }

  get allergies(): string[] {
    return this.props.allergies;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get firstName(): string {
    return this.props.firstName || '';
  }

  get lastName(): string {
    return this.props.lastName || '';
  }

  get age(): number {
    const today = new Date();
    const birth = new Date(this.props.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  updateContact(phone: string, address: string): void {
    this.props.phone = phone;
    this.props.address = address;
    this.props.updatedAt = new Date();
  }

  updateEmergencyContact(contact: string, phone: string): void {
    this.props.emergencyContact = contact;
    this.props.emergencyPhone = phone;
    this.props.updatedAt = new Date();
  }

  addAllergy(allergy: string): void {
    if (!this.props.allergies.includes(allergy)) {
      this.props.allergies.push(allergy);
      this.props.updatedAt = new Date();
    }
  }

  toPlain(): PatientProps {
    return { ...this.props };
  }
}