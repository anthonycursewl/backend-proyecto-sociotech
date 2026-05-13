import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceService } from '@services/application/services/service.service';
import { CreateServiceDto, UpdateServiceDto, ServiceListQueryDto } from '@services/presentation/controllers/service.dto';
import type { ServiceResponse, PaginatedServiceResponse } from '@services/presentation/controllers/service.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import type { Request } from 'express';

@Controller('services')
@UseGuards(AuthGuard('jwt'))
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) { }

  @Post()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('services', 'create')
  async create(@Body(new ValidationPipe({ transform: true })) dto: CreateServiceDto, @Req() req: Request): Promise<ServiceResponse> {
    return this.serviceService.create(dto, (req as any).user.userId);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('services', 'read')
  async findAll(@Query(new ValidationPipe({ transform: true })) query: ServiceListQueryDto): Promise<PaginatedServiceResponse> {
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
  async update(@Param('id') id: string, @Body(new ValidationPipe({ transform: true })) dto: UpdateServiceDto): Promise<ServiceResponse> {
    return this.serviceService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('services', 'delete')
  async delete(@Param('id') id: string): Promise<void> {
    return this.serviceService.delete(id);
  }
}