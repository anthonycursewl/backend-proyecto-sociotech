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
} from '../../domain/repositories/patient-repository.port';
import { Patient } from '../../domain/entities/patient.entity';
import {
  CreatePatientDto,
  UpdatePatientDto,
  RegisterPatientDto,
} from '../../presentation/controllers/patient.dto';
import { PatientMetricsService } from './patient-metrics.service';

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
      throw new BadRequestException('This user already has a patient record');
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
        'You already have a patient record. You can only register once.',
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
      throw new NotFoundException('Patient not found');
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
      allergies: dto.allergies,
      currentMedications: dto.currentMedications,
      chronicDiseases: dto.chronicDiseases,
    });
    return this.patientRepo.update(id, patient.toPlain());
  }

  async search(query: string, limit?: number): Promise<Patient[]> {
    return this.patientRepo.search(query, limit);
  }

  async findManyCursor(
    cursor?: string,
    limit = 20,
    isActive?: boolean,
  ): Promise<PaginatedPatients> {
    return this.patientRepo.findManyCursor(cursor, limit, isActive);
  }
}
