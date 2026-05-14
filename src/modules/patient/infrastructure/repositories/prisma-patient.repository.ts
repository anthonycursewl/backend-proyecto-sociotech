import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PatientRepository } from '../../domain/repositories/patient-repository.port';
import { Patient, PatientProps } from '../../domain/entities/patient.entity';
import { PatientPrismaService } from '../db/prisma.service';

type PatientModel = Prisma.PatientGetPayload<{}>;

@Injectable()
export class PrismaPatientRepository implements PatientRepository {
  constructor(
    @Inject(PatientPrismaService) private readonly prisma: PatientPrismaService,
  ) {}

  private toDomain(p: PatientModel): Patient {
    return new Patient({
      id: p.id,
      userId: p.userId,
      medicalId: p.medicalId,
      cedula: p.cedula ?? undefined,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender ?? undefined,
      occupation: p.occupation ?? undefined,
      civilStatus: p.civilStatus ?? undefined,
      phone: p.phone,
      address: p.address,
      emergencyContact: p.emergencyContact,
      emergencyPhone: p.emergencyPhone,
      bloodType: p.bloodType ?? undefined,
      allergies: p.allergies ?? [],
      currentMedications: p.currentMedications ?? [],
      chronicDiseases: p.chronicDiseases ?? [],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }

  async save(patient: Patient): Promise<Patient> {
    const p = await this.prisma.patient.create({
      data: {
        id: patient.id,
        userId: patient.userId,
        medicalId: patient.medicalId,
        cedula: patient.cedula,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        occupation: patient.occupation,
        civilStatus: patient.civilStatus,
        phone: patient.phone,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        emergencyPhone: patient.emergencyPhone,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        currentMedications: patient.currentMedications,
        chronicDiseases: patient.chronicDiseases,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      },
    });
    return this.toDomain(p);
  }

  async findById(id: string): Promise<Patient | null> {
    const p = await this.prisma.patient.findUnique({ where: { id } });
    return p ? this.toDomain(p) : null;
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    const p = await this.prisma.patient.findUnique({ where: { userId } });
    return p ? this.toDomain(p) : null;
  }

  async findByMedicalId(medicalId: string): Promise<Patient | null> {
    const p = await this.prisma.patient.findUnique({ where: { medicalId } });
    return p ? this.toDomain(p) : null;
  }

  async findAll(): Promise<Patient[]> {
    const patients = await this.prisma.patient.findMany();
    return patients.map(p => this.toDomain(p));
  }

  async update(id: string, data: PatientProps): Promise<Patient> {
    const p = await this.prisma.patient.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(p);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.patient.delete({ where: { id } });
  }

  async search(query: string, limit = 20): Promise<Patient[]> {
    const patients = await this.prisma.patient.findMany({
      where: {
        OR: [
          { medicalId: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });
    return patients.map(p => this.toDomain(p));
  }
}
