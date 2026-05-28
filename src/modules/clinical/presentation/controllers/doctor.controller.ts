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
  UseInterceptors,
  Inject,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AuthGuard } from '@nestjs/passport';
import { DoctorService } from '@clinical/application/services/doctor.service';
import type { PaginatedDoctors } from '@clinical/domain/repositories/doctor-repository.port';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
} from '@clinical/presentation/controllers/doctor.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import { Audit } from '../../../audit/audit.decorator';
import { AuditInterceptor } from '../../../audit/audit.interceptor';

@Controller('doctors')
@UseInterceptors(AuditInterceptor)
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post('profile')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'create:own')
  @Audit('doctors:create:own', 'Doctor')
  async createProfile(@Body() dto: CreateDoctorDto, @Req() req) {
    return this.doctorService.create(req.user.userId, dto);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'manage')
  @Audit('doctors:create', 'Doctor')
  async create(@Body() dto: CreateDoctorDto, @Req() req) {
    return this.doctorService.create(req.user.userId, dto);
  }

  @Get('me/profile')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'read')
  async getMyProfile(@Req() req) {
    return this.doctorService.findByUserId(req.user.userId);
  }

  @Put('me/profile')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'update:own')
  @Audit('doctors:update:own', 'Doctor', true)
  async updateMyProfile(@Body() dto: UpdateDoctorDto, @Req() req) {
    const doctor = await this.doctorService.findByUserId(req.user.userId);
    return this.doctorService.update(doctor.id, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'read')
  async findAll(@Query('includeInactive') includeInactive: string) {
    const include = includeInactive === 'true';
    return this.doctorService.findAll(include);
  }

  @Put('admin/:id/toggle-active')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'manage')
  @Audit('doctors:update', 'Doctor', true)
  async toggleActive(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    const doctor = await this.doctorService.findById(id);
    (req as any).auditSnapshot = { isActive: doctor.isActive };
    const updated = await this.doctorService.update(id, { isActive: !doctor.isActive } as UpdateDoctorDto);
    await this.cacheManager.del(`doctor:${id}`);
    return updated;
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'read')
  async list(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ): Promise<PaginatedDoctors> {
    const activeFilter = isActive !== undefined ? isActive === 'true' : undefined;
    return this.doctorService.findManyCursor(cursor, parseInt(limit || '20'), activeFilter);
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'read')
  async findByUserId(@Param('userId') userId: string) {
    return this.doctorService.findByUserId(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'read')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const cacheKey = `doctor:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }
    const result = await this.doctorService.findById(id);
    await this.cacheManager.set(cacheKey, result, 30_000);
    return result;
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'manage')
  @Audit('doctors:update', 'Doctor', true)
  async update(@Param('id') id: string, @Body() dto: UpdateDoctorDto, @Req() req) {
    const old = await this.doctorService.findById(id);
    (req as any).auditSnapshot = old.toPlain();
    const result = await this.doctorService.update(id, dto);
    await this.cacheManager.del(`doctor:${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'manage')
  @Audit('doctors:delete', 'Doctor')
  async delete(@Param('id') id: string) {
    return this.doctorService.delete(id);
  }
}
