import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PATIENT_REPOSITORY } from '../../domain/repositories/patient-repository.port';
import type {
  PatientRepository,
  PaginatedPatients,
  PatientSummary,
} from '../../domain/repositories/patient-repository.port';
import { Patient } from '../../domain/entities/patient.entity';
import {
  CreatePatientDto,
  UpdatePatientDto,
  RegisterPatientDto,
} from '../../presentation/controllers/patient.dto';
import { PatientMetricsService } from './patient-metrics.service';
import { DEFAULT_PAGE_SIZE } from '@shared/constants';

@Injectable()
export class PatientService {
  constructor(
    @Inject(PATIENT_REPOSITORY) private readonly patientRepo: PatientRepository,
    private readonly patientMetricsService: PatientMetricsService,
  ) {}

  private generateMedicalId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `HM-${timestamp}-${random}`;
  }

  async create(dto: CreatePatientDto): Promise<Patient> {
    const existing = await this.patientRepo.findByUserId(dto.userId);
    if (existing) {
      throw new BadRequestException('Este usuario ya tiene un registro de paciente');
    }

    const patient = new Patient({
      id: crypto.randomUUID(),
      userId: dto.userId,
      medicalId: this.generateMedicalId(),
      cedula: dto.cedula,
      dateOfBirth: new Date(dto.dateOfBirth),
      gender: dto.gender,
      occupation: dto.occupation,
      civilStatus: dto.civilStatus,
      phone: dto.phone,
      address: dto.address,
      emergencyContact: dto.emergencyContact,
      emergencyPhone: dto.emergencyPhone,
      bloodType: dto.bloodType,
      allergies: dto.allergies ?? [],
      currentMedications: dto.currentMedications ?? [],
      chronicDiseases: dto.chronicDiseases ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.patientRepo.save(patient);
    await this.patientMetricsService.refresh();
    return saved;
  }

  async registerPatientForUser(
    userId: string,
    dto: RegisterPatientDto,
  ): Promise<Patient> {
    const existing = await this.patientRepo.findByUserId(userId);
    if (existing) {
      throw new BadRequestException(
        'Ya tienes un registro de paciente. Solo puedes registrarte una vez.',
      );
    }

    const patient = new Patient({
      id: crypto.randomUUID(),
      userId,
      medicalId: this.generateMedicalId(),
      cedula: dto.cedula,
      dateOfBirth: new Date(dto.dateOfBirth),
      gender: dto.gender,
      occupation: dto.occupation,
      civilStatus: dto.civilStatus,
      phone: dto.phone,
      address: dto.address,
      emergencyContact: dto.emergencyContact,
      emergencyPhone: dto.emergencyPhone,
      bloodType: dto.bloodType,
      allergies: dto.allergies ?? [],
      currentMedications: dto.currentMedications ?? [],
      chronicDiseases: dto.chronicDiseases ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.patientRepo.save(patient);
    await this.patientMetricsService.refresh();
    return saved;
  }

  async findById(id: string): Promise<Patient> {
    const patient = await this.patientRepo.findById(id);
    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }
    return patient;
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    return this.patientRepo.findByUserId(userId);
  }

  async findAll(): Promise<Patient[]> {
    return this.patientRepo.findAll();
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findById(id);
    patient.update({
      cedula: dto.cedula,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      gender: dto.gender,
      occupation: dto.occupation,
      civilStatus: dto.civilStatus,
      phone: dto.phone,
      address: dto.address,
      emergencyContact: dto.emergencyContact,
      emergencyPhone: dto.emergencyPhone,
      bloodType: dto.bloodType,
    });
    const updated = patient.toPlain();
    if (dto.allergies !== undefined) updated.allergies = dto.allergies;
    if (dto.currentMedications !== undefined)
      updated.currentMedications = dto.currentMedications;
    if (dto.chronicDiseases !== undefined)
      updated.chronicDiseases = dto.chronicDiseases;
    return this.patientRepo.update(id, updated);
  }

  async search(query: string, limit?: number): Promise<PatientSummary[]> {
    return this.patientRepo.search(query, limit);
  }

  async delete(id: string): Promise<void> {
    const patient = await this.findById(id);
    await this.patientRepo.delete(id);
  }

  async findManyCursor(
    cursor?: string,
    limit = DEFAULT_PAGE_SIZE,
    isActive?: boolean,
  ): Promise<PaginatedPatients> {
    return this.patientRepo.findManyCursor(cursor, limit, isActive);
  }
}
