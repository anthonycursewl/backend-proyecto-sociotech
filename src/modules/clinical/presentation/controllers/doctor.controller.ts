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
import { Audit } from '@audit/audit.decorator';
import { AuditInterceptor } from '@audit/audit.interceptor';
import type { RequestWithUser } from '@audit/audit.interceptor';
import { DEFAULT_PAGE_SIZE, ENTITY_CACHE_TTL } from '@shared/constants';

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
  async createProfile(
    @Body() dto: CreateDoctorDto,
    @Req() req: RequestWithUser,
  ) {
    return this.doctorService.create(req.user!.userId, dto);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'manage')
  @Audit('doctors:create', 'Doctor')
  async create(@Body() dto: CreateDoctorDto, @Req() req: RequestWithUser) {
    return this.doctorService.create(req.user!.userId, dto);
  }

  @Get('me/profile')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'read')
  async getMyProfile(@Req() req: RequestWithUser) {
    return this.doctorService.findByUserId(req.user!.userId);
  }

  @Put('me/profile')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'update:own')
  @Audit('doctors:update:own', 'Doctor', true)
  async updateMyProfile(
    @Body() dto: UpdateDoctorDto,
    @Req() req: RequestWithUser,
  ) {
    const doctor = await this.doctorService.findByUserId(req.user!.userId);
    return this.doctorService.update(doctor.id, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'read')
  async findAll(
    @Query('includeInactive') includeInactive: string,
    @Query('includeInvisible') includeInvisible: string,
  ) {
    const includeInact = includeInactive === 'true';
    const includeInvis = includeInvisible === 'true';
    return this.doctorService.findAll(includeInact, includeInvis);
  }

  @Put('admin/:id/toggle-active')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'manage')
  @Audit('doctors:update', 'Doctor', true)
  async toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    const doctor = await this.doctorService.findById(id);
    req.auditSnapshot = { isActive: doctor.isActive };
    const updated = await this.doctorService.update(id, {
      isActive: !doctor.isActive,
    });
    await this.cacheManager.del(`doctor:${id}`);
    return updated;
  }

  @Put('me/visibility')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'update:own')
  @Audit('doctors:update:own', 'Doctor', true)
  async toggleMyVisibility(@Req() req: RequestWithUser) {
    return this.doctorService.toggleVisibility(req.user!.userId);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'read')
  async list(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
    @Query('isVisible') isVisible?: string,
  ): Promise<PaginatedDoctors> {
    const activeFilter =
      isActive !== undefined ? isActive === 'true' : undefined;
    const visibleFilter =
      isVisible !== undefined ? isVisible === 'true' : undefined;
    return this.doctorService.findManyCursor(
      cursor,
      parseInt(limit || String(DEFAULT_PAGE_SIZE)),
      activeFilter,
      visibleFilter,
    );
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
    await this.cacheManager.set(cacheKey, result, ENTITY_CACHE_TTL);
    return result;
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'manage')
  @Audit('doctors:update', 'Doctor', true)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDoctorDto,
    @Req() req: RequestWithUser,
  ) {
    const old = await this.doctorService.findById(id);
    req.auditSnapshot = old.toPlain() as unknown as Record<string, unknown>;
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
