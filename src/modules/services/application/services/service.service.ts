import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '@services/domain/repositories/service-repository.port';
import { Service } from '@services/domain/entities/service.entity';
import { CreateServiceDto, UpdateServiceDto } from '@services/presentation/controllers/service.dto';

@Injectable()
export class ServiceService {
  private readonly logger = new Logger(ServiceService.name);

  constructor(
    @Inject(SERVICE_REPOSITORY) private readonly serviceRepo: any,
  ) {}

  async create(dto: CreateServiceDto, userId: string): Promise<Service> {
    const existing = await this.serviceRepo.findByName?.(dto.name);
    if (existing) {
      throw new ForbiddenException('Service with this name already exists');
    }

    const service = new Service({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      durationMin: dto.durationMin || 30,
      price: dto.price,
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.serviceRepo.save(service);
  }

  async findAll(includeInactive = false): Promise<Service[]> {
    return await this.serviceRepo.findAll(includeInactive);
  }

  async findById(id: string): Promise<Service> {
    const service = await this.serviceRepo.findById(id);
    if (!service) {
      throw new ForbiddenException('Service not found');
    }
    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findById(id);
    service.update({
      name: dto.name,
      description: dto.description,
      durationMin: dto.durationMin,
      price: dto.price,
      isActive: dto.isActive,
    });
    return await this.serviceRepo.update(id, service);
  }

  async delete(id: string): Promise<void> {
    // Soft delete - just mark as inactive
    const service = await this.findById(id);
    service.update({ isActive: false });
    await this.serviceRepo.update(id, service);
  }
}
