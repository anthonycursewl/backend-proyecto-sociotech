export class DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<DoctorSchedule>) {
    Object.assign(this, data);
  }

  update(data: Partial<DoctorSchedule>) {
    Object.assign(this, data);
    this.updatedAt = new Date();
  }
}