import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DOCTOR_REPOSITORY } from '@clinical/domain/repositories/doctor-repository.port';
import type {
  DoctorRepository,
  PaginatedDoctors,
} from '@clinical/domain/repositories/doctor-repository.port';
import { Doctor } from '@clinical/entities/doctor.entity';
import type {
  CreateDoctorDto,
  UpdateDoctorDto,
} from '@clinical/presentation/controllers/doctor.dto';
import { DEFAULT_PAGE_SIZE } from '@shared/constants';

@Injectable()
export class DoctorService {
  private readonly logger = new Logger(DoctorService.name);

  constructor(
    @Inject(DOCTOR_REPOSITORY) private readonly doctorRepo: DoctorRepository,
  ) {}

  async create(userId: string, dto: CreateDoctorDto): Promise<Doctor> {
    const existing = await this.doctorRepo.findByUserId(userId);
    if (existing) {
      throw new ForbiddenException(
        'El perfil de doctor ya existe para este usuario',
      );
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
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.doctorRepo.save(doctor);
  }

  async findAll(
    includeInactive = false,
    includeInvisible = false,
  ): Promise<Doctor[]> {
    return await this.doctorRepo.findAll(includeInactive, includeInvisible);
  }

  async findById(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepo.findById(id);
    if (!doctor) {
      throw new ForbiddenException('Doctor no encontrado');
    }
    return doctor;
  }

  async findByUserId(userId: string): Promise<Doctor> {
    const doctor = await this.doctorRepo.findByUserId(userId);
    if (!doctor) {
      throw new ForbiddenException('Perfil de doctor no encontrado');
    }
    return doctor;
  }

  async findManyCursor(
    cursor?: string,
    limit = DEFAULT_PAGE_SIZE,
    isActive?: boolean,
    isVisible?: boolean,
  ): Promise<PaginatedDoctors> {
    return this.doctorRepo.findManyCursor(cursor, limit, isActive, isVisible);
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
      isVisible: dto.isVisible,
    });
    return await this.doctorRepo.update(id, doctor);
  }

  async toggleVisibility(userId: string): Promise<Doctor> {
    const doctor = await this.findByUserId(userId);
    doctor.update({ isVisible: !doctor.isVisible });
    return await this.doctorRepo.update(doctor.id, doctor);
  }

  async delete(id: string): Promise<void> {
    // Soft delete - just mark as inactive
    const doctor = await this.findById(id);
    doctor.update({ isActive: false });
    await this.doctorRepo.update(id, doctor);
  }
}
