import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DOCTOR_REPOSITORY } from '@clinical/domain/repositories/doctor-repository.port';
import { Doctor } from '@clinical/entities/doctor.entity';
import { CreateDoctorDto, UpdateDoctorDto } from '@clinical/presentation/controllers/doctor.dto';

@Injectable()
export class DoctorService {
  private readonly logger = new Logger(DoctorService.name);

  constructor(
    @Inject(DOCTOR_REPOSITORY) private readonly doctorRepo: any,
  ) {}

  async create(userId: string, dto: CreateDoctorDto): Promise<Doctor> {
    // Check if doctor profile already exists for this user
    const existing = await this.doctorRepo.findByUserId(userId);
    if (existing) {
      throw new ForbiddenException('Doctor profile already exists for this user');
    }

    const doctor = new Doctor({
      id: crypto.randomUUID(),
      userId,
      specialty: dto.specialty,
      licenseNumber: dto.licenseNumber,
      consultationPrice: dto.consultationPrice,
      biography: dto.biography,
      phoneNumber: dto.phoneNumber,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.doctorRepo.save(doctor);
  }

  async findAll(includeInactive = false): Promise<Doctor[]> {
    return await this.doctorRepo.findAll(includeInactive);
  }

  async findById(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepo.findById(id);
    if (!doctor) {
      throw new ForbiddenException('Doctor not found');
    }
    return doctor;
  }

  async findByUserId(userId: string): Promise<Doctor> {
    const doctor = await this.doctorRepo.findByUserId(userId);
    if (!doctor) {
      throw new ForbiddenException('Doctor profile not found');
    }
    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findById(id);
    doctor.update({
      specialty: dto.specialty,
      licenseNumber: dto.licenseNumber,
      consultationPrice: dto.consultationPrice,
      biography: dto.biography,
      phoneNumber: dto.phoneNumber,
      isActive: dto.isActive,
    });
    return await this.doctorRepo.update(id, doctor);
  }

  async delete(id: string): Promise<void> {
    // Soft delete - just mark as inactive
    const doctor = await this.findById(id);
    doctor.update({ isActive: false });
    await this.doctorRepo.update(id, doctor);
  }
}
