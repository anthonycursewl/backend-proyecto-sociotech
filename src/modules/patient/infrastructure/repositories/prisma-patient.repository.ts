import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  PatientRepository,
  PatientSummary,
  PaginatedPatients,
} from '../../domain/repositories/patient-repository.port';
import { Patient, PatientProps } from '../../domain/entities/patient.entity';
import { PatientPrismaService } from '../db/prisma.service';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@shared/constants';

type PatientModel = Prisma.PatientGetPayload<{
  include: {
    allergies: true;
    medications: true;
    chronicDiseases: true;
  };
}>;
type PatientWithUser = Prisma.PatientGetPayload<{
  include: {
    user: { select: { firstName: true; lastName: true; email: true } };
    allergies: true;
    medications: true;
    chronicDiseases: true;
  };
}>;

@Injectable()
export class PrismaPatientRepository implements PatientRepository {
  constructor(
    @Inject(PatientPrismaService) private readonly prisma: PatientPrismaService,
  ) {}

  private toDomain(
    p: PatientModel,
    user?: { firstName: string; lastName: string; email: string },
  ): Patient {
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
      allergies: p.allergies.map((a) => a.name),
      currentMedications: p.medications.map((m) => m.name),
      chronicDiseases: p.chronicDiseases.map((c) => c.name),
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }

  private getRelations(): Prisma.PatientInclude {
    return {
      allergies: true,
      medications: true,
      chronicDiseases: true,
    };
  }

  private getUserRelations(): Prisma.PatientInclude {
    return {
      user: { select: { firstName: true, lastName: true, email: true } },
      allergies: true,
      medications: true,
      chronicDiseases: true,
    };
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
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        allergies: { create: patient.allergies.map((name) => ({ name })) },
        medications: { create: patient.currentMedications.map((name) => ({ name })) },
        chronicDiseases: { create: patient.chronicDiseases.map((name) => ({ name })) },
      },
      include: this.getRelations(),
    });
    return this.toDomain(p);
  }

  async findById(id: string): Promise<Patient | null> {
    const p = (await this.prisma.patient.findUnique({
      where: { id },
      include: this.getUserRelations(),
    })) as (PatientWithUser & PatientModel) | null;
    if (!p) return null;
    return this.toDomain(p, p.user);
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    const p = (await this.prisma.patient.findUnique({
      where: { userId },
      include: this.getRelations(),
    })) as PatientModel | null;
    return p ? this.toDomain(p) : null;
  }

  async findByMedicalId(medicalId: string): Promise<Patient | null> {
    const p = (await this.prisma.patient.findUnique({
      where: { medicalId },
      include: this.getRelations(),
    })) as PatientModel | null;
    return p ? this.toDomain(p) : null;
  }

  async findAll(): Promise<Patient[]> {
    const patients = (await this.prisma.patient.findMany({
      include: this.getRelations(),
    })) as PatientModel[];
    return patients.map((p) => this.toDomain(p));
  }

  async update(id: string, data: PatientProps): Promise<Patient> {
    const { allergies, currentMedications, chronicDiseases, ...rest } = data;

    const p = (await this.prisma.$transaction(async (tx) => {
      if (allergies !== undefined) {
        await tx.patientAllergy.deleteMany({ where: { patientId: id } });
        if (allergies.length > 0) {
          await tx.patientAllergy.createMany({
            data: allergies.map((name) => ({ patientId: id, name })),
          });
        }
      }
      if (currentMedications !== undefined) {
        await tx.patientMedication.deleteMany({ where: { patientId: id } });
        if (currentMedications.length > 0) {
          await tx.patientMedication.createMany({
            data: currentMedications.map((name) => ({ patientId: id, name })),
          });
        }
      }
      if (chronicDiseases !== undefined) {
        await tx.patientChronicDisease.deleteMany({ where: { patientId: id } });
        if (chronicDiseases.length > 0) {
          await tx.patientChronicDisease.createMany({
            data: chronicDiseases.map((name) => ({ patientId: id, name })),
          });
        }
      }
      return tx.patient.update({
        where: { id },
        data: { ...rest, updatedAt: new Date() },
        include: this.getRelations(),
      });
    })) as PatientModel;

    return this.toDomain(p);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.patient.delete({ where: { id } });
  }

  async search(query: string, limit = DEFAULT_PAGE_SIZE): Promise<PatientSummary[]> {
    const patients = (await this.prisma.patient.findMany({
      where: {
        OR: [
          { medicalId: { contains: query, mode: 'insensitive' } },
          { cedula: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { user: { firstName: { contains: query, mode: 'insensitive' } } },
          { user: { lastName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { id: 'desc' },
      include: this.getUserRelations(),
    })) as (PatientWithUser & PatientModel)[];

    return patients.map((p) => ({
      id: p.id,
      userId: p.userId,
      medicalId: p.medicalId,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      email: p.user.email,
      cedula: p.cedula,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      phone: p.phone,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  async findManyCursor(
    cursor?: string,
    limit = DEFAULT_PAGE_SIZE,
    isActive?: boolean,
  ): Promise<PaginatedPatients> {
    const take = Math.min(limit, MAX_PAGE_SIZE);
    const where: Prisma.PatientWhereInput = {
      ...(cursor ? { id: { lt: cursor } } : {}),
      ...(isActive !== undefined ? { user: { isActive } } : {}),
    };

    const patients = (await this.prisma.patient.findMany({
      where,
      take: take + 1,
      orderBy: { id: 'desc' },
      include: this.getUserRelations(),
    })) as (PatientWithUser & PatientModel)[];

    const hasNext = patients.length > take;
    if (hasNext) {
      patients.pop();
    }

    const nextCursor = hasNext
      ? (patients[patients.length - 1]?.id ?? null)
      : null;

    return {
      patients: patients.map((p) => ({
        id: p.id,
        userId: p.userId,
        medicalId: p.medicalId,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        email: p.user.email,
        cedula: p.cedula,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        phone: p.phone,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      nextCursor,
      hasNext,
    };
  }
}
