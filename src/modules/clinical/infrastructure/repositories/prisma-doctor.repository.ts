import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DOCTOR_REPOSITORY, DoctorRepository } from '@clinical/domain/repositories/doctor-repository.port';
import { Doctor } from '@clinical/entities/doctor.entity';
import { PrismaService } from '@clinical/infrastructure/db/prisma.service';

@Injectable()
export class PrismaDoctorRepository implements DoctorRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: any,
  ) {}

  private toDomain(prismaDoctor: any): Doctor {
    return new Doctor({
      id: prismaDoctor.id,
      userId: prismaDoctor.userId,
      specialty: prismaDoctor.specialty,
      licenseNumber: prismaDoctor.licenseNumber,
      consultationPrice: prismaDoctor.consultationPrice,
      biography: prismaDoctor.biography,
      phoneNumber: prismaDoctor.phoneNumber,
      isActive: prismaDoctor.isActive,
      createdAt: prismaDoctor.createdAt,
      updatedAt: prismaDoctor.updatedAt,
    });
  }

  async save(data: Doctor): Promise<Doctor> {
    const prismaDoctor = await this.prisma.doctor.create({
      data: {
        id: data.id,
        userId: data.userId,
        specialty: data.specialty,
        licenseNumber: data.licenseNumber,
        consultationPrice: data.consultationPrice,
        biography: data.biography,
        phoneNumber: data.phoneNumber,
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
    return this.toDomain(prismaDoctor);
  }

  async findById(id: string): Promise<Doctor | null> {
    const prismaDoctor = await this.prisma.doctor.findUnique({
      where: { id },
    });
    return prismaDoctor ? this.toDomain(prismaDoctor) : null;
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    const prismaDoctor = await this.prisma.doctor.findUnique({
      where: { userId },
    });
    return prismaDoctor ? this.toDomain(prismaDoctor) : null;
  }

  async findAll(includeInactive = false): Promise<Doctor[]> {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    const doctors = await this.prisma.doctor.findMany({ where });
    return doctors.map(d => this.toDomain(d));
  }

  async update(id: string, data: Doctor): Promise<Doctor> {
    const prismaDoctor = await this.prisma.doctor.update({
      where: { id },
      data: {
        ...(data.specialty !== undefined && { specialty: data.specialty }),
        ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
        ...(data.consultationPrice !== undefined && { consultationPrice: data.consultationPrice }),
        ...(data.biography !== undefined && { biography: data.biography }),
        ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(prismaDoctor);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.doctor.delete({
      where: { id },
    });
  }
}
