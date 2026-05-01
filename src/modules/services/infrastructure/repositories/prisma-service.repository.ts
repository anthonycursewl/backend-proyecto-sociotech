import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { SERVICE_REPOSITORY, ServiceRepository } from '@services/domain/repositories/service-repository.port';
import { Service } from '@services/domain/entities/service.entity';
import { PrismaService } from '@services/infrastructure/db/prisma.service';

@Injectable()
export class PrismaServiceRepository implements ServiceRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: any,
  ) {}

  private toDomain(prismaService: any): any {
    return {
      id: prismaService.id,
      name: prismaService.name,
      description: prismaService.description,
      durationMin: prismaService.durationMin,
      price: prismaService.price,
      isActive: prismaService.isActive,
      createdBy: prismaService.createdBy,
      createdAt: prismaService.createdAt,
      updatedAt: prismaService.updatedAt,
    };
  }

  async save(data: any): Promise<any> {
    return await this.prisma.service.create({
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
  }

  async findById(id: string): Promise<any | null> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });
    return service ? this.toDomain(service) : null;
  }

  async findByName(name: string): Promise<any | null> {
    const service = await this.prisma.service.findUnique({
      where: { name },
    });
    return service ? this.toDomain(service) : null;
  }

  async findAll(includeInactive = false): Promise<any[]> {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    const services = await this.prisma.service.findMany({ where });
    return services.map(s => this.toDomain(s));
  }

  async update(id: string, data: any): Promise<any> {
    const service = await this.prisma.service.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.durationMin !== undefined && { durationMin: data.durationMin }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(service);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.service.delete({
      where: { id },
    });
  }

  async findByDoctor(doctorId: string): Promise<any[]> {
    const services = await this.prisma.service.findMany({
      where: {
        doctors: {
          some: { id: doctorId },
        },
      },
    });
    return services.map(s => this.toDomain(s));
  }
}
