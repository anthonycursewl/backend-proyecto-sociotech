import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ValidationPipe,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceService } from '@services/application/services/service.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceListQueryDto,
} from '@services/presentation/controllers/service.dto';
import type {
  ServiceResponse,
  PaginatedServiceResponse,
} from '@services/presentation/controllers/service.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import type { Request } from 'express';
import { Audit } from '../../../audit/audit.decorator';
import { AuditInterceptor } from '../../../audit/audit.interceptor';

@Controller('services')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(AuditInterceptor)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('services', 'create')
  @Audit('services:create', 'Service')
  async create(
    @Body(new ValidationPipe({ transform: true })) dto: CreateServiceDto,
    @Req() req: Request,
  ): Promise<ServiceResponse> {
    return this.serviceService.create(dto, (req as any).user.userId);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('services', 'read')
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: ServiceListQueryDto,
  ): Promise<PaginatedServiceResponse> {
    return this.serviceService.findAll({
      cursor: query.cursor,
      limit: query.limit ?? 20,
      includeInactive: query.includeInactive,
    });
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('services', 'read')
  async findById(@Param('id') id: string): Promise<ServiceResponse> {
    return this.serviceService.findById(id);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('services', 'update')
  @Audit('services:update', 'Service', true)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateServiceDto,
    @Req() req: Request,
  ): Promise<ServiceResponse> {
    (req as any).auditSnapshot = await this.serviceService.findById(id);
    return this.serviceService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('services', 'delete')
  @Audit('services:delete', 'Service')
  async delete(@Param('id') id: string): Promise<void> {
    return this.serviceService.delete(id);
  }
}
