export class Email {
  private readonly _value: string;

  constructor(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!Email.isValid(normalizedEmail)) {
      throw new Error('Invalid email format');
    }
    this._value = normalizedEmail;
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}