export interface PrescriptionProps {
  id: string;
  medicalRecordId: string;
  medicationName: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
  createdAt: Date;
}

export interface MedicalRecordProps {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string | null;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string;
  diagnosisCode?: string | null;
  treatment: string;
  notes: string;
  isSigned: boolean;
  signedAt: Date | null;
  bloodPressure?: string | null;
  heartRate?: number | null;
  temperature?: number | null;
  weight?: number | null;
  height?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  prescriptions: PrescriptionProps[];
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

  get appointmentId(): string | null | undefined {
    return this.props.appointmentId;
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

  get diagnosisCode(): string | null | undefined {
    return this.props.diagnosisCode;
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

  get bloodPressure(): string | null | undefined {
    return this.props.bloodPressure;
  }

  get heartRate(): number | null | undefined {
    return this.props.heartRate;
  }

  get temperature(): number | null | undefined {
    return this.props.temperature;
  }

  get weight(): number | null | undefined {
    return this.props.weight;
  }

  get height(): number | null | undefined {
    return this.props.height;
  }

  get respiratoryRate(): number | null | undefined {
    return this.props.respiratoryRate;
  }

  get oxygenSaturation(): number | null | undefined {
    return this.props.oxygenSaturation;
  }

  get prescriptions(): PrescriptionProps[] {
    return this.props.prescriptions;
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
    diagnosisCode: string | null | undefined,
    treatment: string,
    notes: string,
    bloodPressure?: string | null,
    heartRate?: number | null,
    temperature?: number | null,
    weight?: number | null,
    height?: number | null,
    respiratoryRate?: number | null,
    oxygenSaturation?: number | null,
    prescriptions?: PrescriptionProps[],
  ): void {
    if (this.props.isSigned) {
      throw new Error(
        'Cannot update a signed medical record. Create an attachment instead.',
      );
    }
    this.props.chiefComplaint = chiefComplaint;
    this.props.symptoms = symptoms;
    this.props.diagnosis = diagnosis;
    this.props.diagnosisCode = diagnosisCode ?? null;
    this.props.treatment = treatment;
    this.props.notes = notes;
    this.props.bloodPressure = bloodPressure ?? this.props.bloodPressure;
    this.props.heartRate = heartRate ?? this.props.heartRate;
    this.props.temperature = temperature ?? this.props.temperature;
    this.props.weight = weight ?? this.props.weight;
    this.props.height = height ?? this.props.height;
    this.props.respiratoryRate = respiratoryRate ?? this.props.respiratoryRate;
    this.props.oxygenSaturation = oxygenSaturation ?? this.props.oxygenSaturation;
    if (prescriptions !== undefined) {
      this.props.prescriptions = prescriptions;
    }
    this.props.updatedAt = new Date();
  }

  toPlain(): MedicalRecordProps {
    return { ...this.props };
  }
}
