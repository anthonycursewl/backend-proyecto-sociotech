import { Service, ServiceProps } from '../entities/service.entity';

export const SERVICE_REPOSITORY = Symbol('SERVICE_REPOSITORY');

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
  includeInactive?: boolean;
  status?: 'active' | 'inactive' | 'all';
}

export interface PaginatedServices {
  data: ServiceProps[];
  nextCursor: string | null;
}

export interface ServiceRepository {
  save(service: Service): Promise<Service>;
  findById(id: string): Promise<Service | null>;
  findByName(name: string): Promise<Service | null>;
  findAll(params?: CursorPaginationParams): Promise<PaginatedServices>;
  update(id: string, data: Partial<ServiceProps>): Promise<Service>;
  delete(id: string): Promise<void>;
  findByDoctor(
    doctorId: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<PaginatedServices>;
}

export interface CreateServiceParams {
  name: string;
  description?: string;
  durationMin?: number;
  price?: number;
  createdBy: string;
}
