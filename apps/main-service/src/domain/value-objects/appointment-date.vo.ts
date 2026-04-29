export class AppointmentDate {
  private readonly _value: Date;

  constructor(date: Date) {
    if (!(date instanceof Date)) {
      throw new Error('Invalid date');
    }
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date value');
    }
    this._value = date;
  }

  static create(date: Date): AppointmentDate {
    return new AppointmentDate(date);
  }

  static now(): AppointmentDate {
    return new AppointmentDate(new Date());
  }

  get value(): Date {
    return this._value;
  }

  isWeekday(): boolean {
    const day = this._value.getDay();
    return day !== 0 && day !== 6;
  }

  isBusinessHours(startHour: number = 8, endHour: number = 18): boolean {
    const hour = this._value.getHours();
    return hour >= startHour && hour < endHour;
  }

  isInFuture(): boolean {
    return this._value > new Date();
  }

  isSameDay(other: AppointmentDate): boolean {
    return (
      this._value.getFullYear() === other._value.getFullYear() &&
      this._value.getMonth() === other._value.getMonth() &&
      this._value.getDate() === other._value.getDate()
    );
  }

  getTimeSlot(slotMinutes: number = 30): number {
    const startOfDay = new Date(this._value);
    startOfDay.setHours(0, 0, 0, 0);
    const diff = this._value.getTime() - startOfDay.getTime();
    return Math.floor(diff / (slotMinutes * 60000));
  }

  addMinutes(minutes: number): AppointmentDate {
    return new AppointmentDate(new Date(this._value.getTime() + minutes * 60000));
  }

  toString(): string {
    return this._value.toISOString();
  }

  equals(other: AppointmentDate): boolean {
    return this._value.getTime() === other._value.getTime();
  }
}
