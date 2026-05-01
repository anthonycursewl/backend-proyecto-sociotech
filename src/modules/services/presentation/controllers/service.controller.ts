import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceService } from '@services/application/services/service.service';
import { CreateServiceDto, UpdateServiceDto } from '@services/presentation/controllers/service.dto';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() dto: CreateServiceDto, @Req() req) {
    return this.serviceService.create(dto, req.user.userId);
  }

  @Get()
  async findAll(@Query('includeInactive') includeInactive: string) {
    const include = includeInactive === 'true';
    return this.serviceService.findAll(include);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.serviceService.findById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') id: string) {
    return this.serviceService.delete(id);
  }
}
