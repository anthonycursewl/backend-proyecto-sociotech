import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  NotFoundException,
  UseInterceptors,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER, CacheTTL } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { PatientService } from '../../application/services/patient.service';
import { PatientMetricsService } from '../../application/services/patient-metrics.service';
import type { PatientMetricsData } from '../../application/services/patient-metrics.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  RegisterPatientDto,
  PatientResponse,
  toPatientResponse,
} from './patient.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import { Audit } from '../../../audit/audit.decorator';
import { AuditInterceptor } from '../../../audit/audit.interceptor';
import type { PaginatedPatients } from '../../domain/repositories/patient-repository.port';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    permissions: string[];
  };
  auditSnapshot?: Record<string, unknown> | null;
}

@Controller('patients')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(AuditInterceptor)
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly patientMetricsService: PatientMetricsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'create')
  @Audit('patients:create', 'Patient')
  async create(@Body() dto: CreatePatientDto): Promise<PatientResponse> {
    return toPatientResponse(await this.patientService.create(dto));
  }

  @Post('me')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'create:own')
  @Audit('patients:create:own', 'Patient')
  async createMyPatient(
    @Body() dto: RegisterPatientDto,
    @Req() req: RequestWithUser,
  ): Promise<PatientResponse> {
    return toPatientResponse(
      await this.patientService.registerPatientForUser(req.user.userId, dto),
    );
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'read')
  async findAll(): Promise<PatientResponse[]> {
    const patients = await this.patientService.findAll();
    return patients.map(toPatientResponse);
  }

  @Get('me')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'read:own')
  async getMyPatient(@Req() req: RequestWithUser): Promise<PatientResponse> {
    const patient = await this.patientService.findByUserId(req.user.userId);
    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }
    return toPatientResponse(patient);
  }

  @Put('me')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'update:own')
  @Audit('patients:update:own', 'Patient', true)
  async updateMyPatient(
    @Req() req: RequestWithUser,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponse> {
    const patient = await this.patientService.findByUserId(req.user.userId);
    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }
    req.auditSnapshot = patient.toPlain() as unknown as Record<string, unknown>;
    const result = toPatientResponse(await this.patientService.update(patient.id, dto));
    await this.cacheManager.del(`patient:${patient.id}`);
    return result;
  }

  @Get('search')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'read')
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<PatientResponse[]> {
    const patients = await this.patientService.search(
      query,
      parseInt(limit || '20'),
    );
    return patients.map(toPatientResponse);
  }

  @Get('metrics')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'read')
  async metrics(): Promise<PatientMetricsData> {
    return this.patientMetricsService.getMetrics();
  }

  @Get('list')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'read')
  async list(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ): Promise<PaginatedPatients> {
    const activeFilter = isActive !== undefined ? isActive === 'true' : undefined;
    return this.patientService.findManyCursor(cursor, parseInt(limit || '20'), activeFilter);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'read')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PatientResponse> {
    const cacheKey = `patient:${id}`;
    const cached = await this.cacheManager.get<PatientResponse>(cacheKey);
    if (cached) {
      return cached;
    }
    const result = toPatientResponse(await this.patientService.findById(id));
    await this.cacheManager.set(cacheKey, result, 30_000);
    return result;
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'update')
  @Audit('patients:update', 'Patient', true)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @Req() req: RequestWithUser,
  ): Promise<PatientResponse> {
    const oldPatient = await this.patientService.findById(id);
    if (!oldPatient) {
      throw new NotFoundException('Patient not found');
    }
    req.auditSnapshot = oldPatient.toPlain() as unknown as Record<string, unknown>;
    const result = toPatientResponse(await this.patientService.update(id, dto));
    await this.cacheManager.del(`patient:${id}`);
    return result;
  }
}
