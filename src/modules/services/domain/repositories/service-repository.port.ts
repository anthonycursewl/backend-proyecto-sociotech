import { Service, ServiceProps } from '../entities/service.entity';

export const SERVICE_REPOSITORY = Symbol('SERVICE_REPOSITORY');

export interface ServiceRepository {
  save(service: Service): Promise<Service>;
  findById(id: string): Promise<Service | null>;
  findAll(includeInactive?: boolean): Promise<Service[]>;
  update(id: string, data: Partial<Service>): Promise<Service>;
  delete(id: string): Promise<void>;
  findByDoctor(doctorId: string): Promise<Service[]>;
}

export interface CreateServiceParams {
  name: string;
  description?: string;
  durationMin?: number;
  price?: number;
  createdBy: string;
}
