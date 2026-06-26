import { Injectable, Inject } from '@nestjs/common';
import {
  SERVICE_REPOSITORY,
  ServiceRepository,
  CursorPaginationParams,
  PaginatedServices,
} from '@services/domain/repositories/service-repository.port';
import {
  Service,
  ServiceProps,
} from '@services/domain/entities/service.entity';
import { PrismaService } from '@services/infrastructure/db/prisma.service';
import { DEFAULT_PAGE_SIZE } from '@shared/constants';

type ServiceWithDoctors = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number | null;
  isActive: boolean;
  createdBy: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  doctors?: { id: string }[];
};

@Injectable()
export class PrismaServiceRepository implements ServiceRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private toProps(raw: ServiceWithDoctors): ServiceProps {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      durationMin: raw.durationMin,
      price: raw.price,
      isActive: raw.isActive,
      createdBy: raw.createdBy,
      doctorIds: raw.doctors?.map((d) => d.id) ?? [],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private toDomain(props: ServiceProps): Service {
    return new Service(props);
  }

  async save(service: Service): Promise<Service> {
    const data = service.toPlain();
    await this.prisma.service.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        durationMin: data.durationMin,
        price: data.price,
        isActive: data.isActive,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        doctors: data.doctorIds.length
          ? { connect: data.doctorIds.map((id) => ({ id })) }
          : undefined,
      },
    });
    const created = await this.prisma.service.findUnique({
      where: { id: data.id },
      include: { doctors: { select: { id: true } } },
    });
    return this.toDomain(this.toProps(created as ServiceWithDoctors));
  }

  async findById(id: string): Promise<Service | null> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { doctors: { select: { id: true } } },
    });
    return service
      ? this.toDomain(this.toProps(service as ServiceWithDoctors))
      : null;
  }

  async findByName(name: string): Promise<Service | null> {
    const service = await this.prisma.service.findUnique({
      where: { name },
      include: { doctors: { select: { id: true } } },
    });
    return service
      ? this.toDomain(this.toProps(service as ServiceWithDoctors))
      : null;
  }

  async findAll(params?: CursorPaginationParams): Promise<PaginatedServices> {
    const {
      cursor,
      limit = DEFAULT_PAGE_SIZE,
      includeInactive = false,
      status,
    } = params ?? {};

    const where: Record<string, unknown> = {};
    if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'all') {
      // no filter
    } else if (!status && includeInactive) {
      // backward compat: old includeInactive=true without status → all
    } else {
      // status=active OR no params at all → only active
      where.isActive = true;
    }

    const services = await this.prisma.service.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { name: 'asc' },
      include: { doctors: { select: { id: true } } },
    });

    const hasMore = services.length > limit;
    const items = hasMore ? services.slice(0, limit) : services;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      data: items.map((s) => this.toProps(s as ServiceWithDoctors)),
      nextCursor,
    };
  }

  async update(id: string, data: ServiceProps): Promise<Service> {
    await this.prisma.service.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.durationMin !== undefined && {
          durationMin: data.durationMin,
        }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.doctorIds !== undefined && {
          doctors: {
            set: data.doctorIds.map((did) => ({ id: did })),
          },
        }),
        updatedAt: new Date(),
      },
    });
    const updated = await this.prisma.service.findUnique({
      where: { id },
      include: { doctors: { select: { id: true } } },
    });
    return this.toDomain(this.toProps(updated as ServiceWithDoctors));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
  }

  async findByDoctor(doctorId: string): Promise<Service[]> {
    const services = await this.prisma.service.findMany({
      where: {
        isActive: true,
        doctors: {
          some: { id: doctorId },
        },
      },
      include: { doctors: { select: { id: true } } },
    });
    return services.map((s) =>
      this.toDomain(this.toProps(s as ServiceWithDoctors)),
    );
  }
}
