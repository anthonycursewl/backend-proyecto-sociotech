import { Injectable, Inject } from '@nestjs/common';
import { SERVICE_REPOSITORY, ServiceRepository, CursorPaginationParams, PaginatedServices } from '@services/domain/repositories/service-repository.port';
import { Service, ServiceProps } from '@services/domain/entities/service.entity';
import { PrismaService } from '@services/infrastructure/db/prisma.service';

@Injectable()
export class PrismaServiceRepository implements ServiceRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  private toDomain(raw: ServiceProps): Service {
    return new Service(raw);
  }

  private toProps(raw: ServiceProps): ServiceProps {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      durationMin: raw.durationMin,
      price: raw.price,
      isActive: raw.isActive,
      createdBy: raw.createdBy,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  async save(service: Service): Promise<Service> {
    const data = service.toPlain();
    const created = await this.prisma.service.create({
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
      },
    });
    return this.toDomain(this.toProps(created as ServiceProps));
  }

  async findById(id: string): Promise<Service | null> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });
    return service ? this.toDomain(this.toProps(service as ServiceProps)) : null;
  }

  async findByName(name: string): Promise<Service | null> {
    const service = await this.prisma.service.findUnique({
      where: { name },
    });
    return service ? this.toDomain(this.toProps(service as ServiceProps)) : null;
  }

  async findAll(params?: CursorPaginationParams): Promise<PaginatedServices> {
    const { cursor, limit = 20, includeInactive = false } = params ?? {};

    const where: Record<string, unknown> = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const services = await this.prisma.service.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { name: 'asc' },
    });

    const hasMore = services.length > limit;
    const items = hasMore ? services.slice(0, limit) : services;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      data: items.map(s => this.toProps(s as ServiceProps)),
      nextCursor,
    };
  }

  async update(id: string, data: ServiceProps): Promise<Service> {
    const updated = await this.prisma.service.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.durationMin !== undefined && { durationMin: data.durationMin }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(this.toProps(updated as ServiceProps));
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
        doctors: {
          some: { id: doctorId },
        },
      },
    });
    return services.map(s => this.toDomain(this.toProps(s as ServiceProps)));
  }
}
