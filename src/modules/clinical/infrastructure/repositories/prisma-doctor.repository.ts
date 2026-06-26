import { Injectable, Inject } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  DOCTOR_REPOSITORY,
  DoctorRepository,
  DoctorMetrics,
  PaginatedDoctors,
} from '@clinical/domain/repositories/doctor-repository.port';
import { Doctor, DoctorScheduleData } from '@clinical/entities/doctor.entity';
import { PrismaService } from '@clinical/infrastructure/db/prisma.service';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@shared/constants';

type DoctorModel = Prisma.DoctorGetPayload<{}>;
type DoctorWithUser = Prisma.DoctorGetPayload<{
  include: {
    user: { select: { firstName: true; lastName: true; email: true } };
  };
}>;
type DoctorFull = Prisma.DoctorGetPayload<{
  include: {
    user: { select: { firstName: true; lastName: true; email: true } };
    schedules: { where: { isActive: true } };
  };
}>;

function mapSchedules(
  schedules: {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }[],
): DoctorScheduleData[] {
  return schedules.map((s) => ({
    id: s.id,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    isActive: s.isActive,
  }));
}

@Injectable()
export class PrismaDoctorRepository implements DoctorRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private toDomain(
    p: DoctorModel,
    user?: { firstName: string; lastName: string; email: string },
    schedules?: DoctorScheduleData[],
  ): Doctor {
    return new Doctor({
      id: p.id,
      userId: p.userId,
      specialty: p.specialty,
      licenseNumber: p.licenseNumber,
      consultationPrice: p.consultationPrice ?? undefined,
      biography: p.biography ?? undefined,
      phoneNumber: p.phoneNumber ?? undefined,
      isActive: p.isActive,
      isVisible: p.isVisible,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      schedules,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
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
        isVisible: data.isVisible ?? true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
    return this.toDomain(prismaDoctor);
  }

  async findById(id: string): Promise<Doctor | null> {
    const p: DoctorFull | null = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        schedules: { where: { isActive: true } },
      },
    });
    if (!p) return null;
    return this.toDomain(p, p.user, mapSchedules(p.schedules));
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    const p = await this.prisma.doctor.findUnique({ where: { userId } });
    return p ? this.toDomain(p) : null;
  }

  async findAll(
    includeInactive = false,
    includeInvisible = false,
  ): Promise<Doctor[]> {
    const where: Prisma.DoctorWhereInput = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (!includeInvisible) {
      where.isVisible = true;
    }
    const doctors: DoctorWithUser[] = await this.prisma.doctor.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return doctors.map((d) => this.toDomain(d, d.user));
  }

  async findManyCursor(
    cursor?: string,
    limit = DEFAULT_PAGE_SIZE,
    isActive?: boolean,
    isVisible?: boolean,
  ): Promise<PaginatedDoctors> {
    const take = Math.min(limit, MAX_PAGE_SIZE);
    const where: Prisma.DoctorWhereInput = {
      ...(cursor ? { id: { lt: cursor } } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isVisible !== undefined ? { isVisible } : { isVisible: true }),
    };

    const doctors: DoctorWithUser[] = await this.prisma.doctor.findMany({
      where,
      take: take + 1,
      orderBy: { id: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const hasNext = doctors.length > take;
    if (hasNext) {
      doctors.pop();
    }

    const nextCursor = hasNext
      ? (doctors[doctors.length - 1]?.id ?? null)
      : null;

    return {
      doctors: doctors.map((d) => ({
        id: d.id,
        userId: d.userId,
        specialty: d.specialty,
        licenseNumber: d.licenseNumber,
        firstName: d.user.firstName,
        lastName: d.user.lastName,
        email: d.user.email,
        consultationPrice: d.consultationPrice,
        phoneNumber: d.phoneNumber,
        isActive: d.isActive,
        isVisible: d.isVisible,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      nextCursor,
      hasNext,
    };
  }

  async getMetrics(): Promise<DoctorMetrics> {
    const [total, active, inactive, visible, notVisible] =
      await Promise.all([
        this.prisma.doctor.count(),
        this.prisma.doctor.count({ where: { isActive: true } }),
        this.prisma.doctor.count({ where: { isActive: false } }),
        this.prisma.doctor.count({ where: { isVisible: true } }),
        this.prisma.doctor.count({ where: { isVisible: false } }),
      ]);

    return { total, active, inactive, visible, notVisible };
  }

  async update(id: string, data: Doctor): Promise<Doctor> {
    const prismaDoctor = await this.prisma.doctor.update({
      where: { id },
      data: {
        ...(data.specialty !== undefined && { specialty: data.specialty }),
        ...(data.licenseNumber !== undefined && {
          licenseNumber: data.licenseNumber,
        }),
        ...(data.consultationPrice !== undefined && {
          consultationPrice: data.consultationPrice,
        }),
        ...(data.biography !== undefined && { biography: data.biography }),
        ...(data.phoneNumber !== undefined && {
          phoneNumber: data.phoneNumber,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(prismaDoctor);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.doctor.delete({ where: { id } });
  }
}
