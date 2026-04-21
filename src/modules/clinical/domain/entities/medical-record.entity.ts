export interface MedicalRecordProps {
  id: string;
  patientId: string;
  doctorId: string;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string;
  treatment: string;
  notes: string;
  isSigned: boolean;
  signedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MedicalRecord {
  private readonly props: MedicalRecordProps;

  constructor(props: MedicalRecordProps) {
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

  get chiefComplaint(): string {
    return this.props.chiefComplaint;
  }

  get symptoms(): string[] {
    return this.props.symptoms;
  }

  get diagnosis(): string {
    return this.props.diagnosis;
  }

  get treatment(): string {
    return this.props.treatment;
  }

  get notes(): string {
    return this.props.notes;
  }

  get isSigned(): boolean {
    return this.props.isSigned;
  }

  get signedAt(): Date | null {
    return this.props.signedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  sign(): void {
    if (this.props.isSigned) {
      throw new Error('Medical record is already signed');
    }
    this.props.isSigned = true;
    this.props.signedAt = new Date();
    this.props.updatedAt = new Date();
  }

  updateContent(
    chiefComplaint: string,
    symptoms: string[],
    diagnosis: string,
    treatment: string,
    notes: string,
  ): void {
    if (this.props.isSigned) {
      throw new Error('Cannot update a signed medical record. Create an attachment instead.');
    }
    this.props.chiefComplaint = chiefComplaint;
    this.props.symptoms = symptoms;
    this.props.diagnosis = diagnosis;
    this.props.treatment = treatment;
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  toPlain(): MedicalRecordProps {
    return { ...this.props };
  }
}