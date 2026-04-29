export class MedicalID {
  private readonly _value: string;

  constructor(medicalId: string) {
    const normalized = medicalId.toUpperCase().trim();
    if (!MedicalID.isValid(normalized)) {
      throw new Error('Invalid Medical ID format. Expected format: MED-XXXXXXXX');
    }
    this._value = normalized;
  }

  private static isValid(medicalId: string): boolean {
    const medicalIdRegex = /^MED-[A-Z0-9]{8}$/;
    return medicalIdRegex.test(medicalId);
  }

  static generate(): MedicalID {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return new MedicalID(`MED-${randomPart}`);
  }

  get value(): string {
    return this.value;
  }

  equals(other: MedicalID): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
