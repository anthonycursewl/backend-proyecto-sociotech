import { Injectable, NotFoundException, ConflictException, Logger, Inject } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '@services/domain/repositories/service-repository.port';
import type { ServiceRepository, CursorPaginationParams } from '@services/domain/repositories/service-repository.port';
import { Service } from '@services/domain/entities/service.entity';
import type { CreateServiceDto, UpdateServiceDto, ServiceResponse, PaginatedServiceResponse } from '@services/presentation/controllers/service.dto';

@Injectable()
export class ServiceService {
  private readonly logger = new Logger(ServiceService.name);

  constructor(
    @Inject(SERVICE_REPOSITORY) private readonly serviceRepo: ServiceRepository,
  ) {}

  async create(dto: CreateServiceDto, userId: string): Promise<ServiceResponse> {
    const existing = await this.serviceRepo.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Service with this name already exists');
    }

    const service = new Service({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description ?? null,
      durationMin: dto.durationMin || 30,
      price: dto.price ?? null,
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.serviceRepo.save(service);
    return saved.toPlain() as unknown as ServiceResponse;
  }

  async findAll(params?: CursorPaginationParams): Promise<PaginatedServiceResponse> {
    const result = await this.serviceRepo.findAll(params);
    return result as unknown as PaginatedServiceResponse;
  }

  async findById(id: string): Promise<ServiceResponse> {
    const service = await this.serviceRepo.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service.toPlain() as unknown as ServiceResponse;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<ServiceResponse> {
    const service = await this.serviceRepo.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (dto.name && dto.name !== service.name) {
      const existing = await this.serviceRepo.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Service with this name already exists');
      }
    }

    service.update({
      name: dto.name,
      description: dto.description ?? null,
      durationMin: dto.durationMin,
      price: dto.price ?? null,
      isActive: dto.isActive,
    });

    const updated = await this.serviceRepo.update(id, service.toPlain());
    return updated.toPlain() as unknown as ServiceResponse;
  }

  async delete(id: string): Promise<void> {
    const service = await this.serviceRepo.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    service.update({ isActive: false });
    await this.serviceRepo.update(id, service.toPlain());
  }
}
