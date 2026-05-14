import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { PatientService } from '../../application/services/patient.service';
import { CreatePatientDto, UpdatePatientDto, RegisterPatientDto, PatientResponse, toPatientResponse } from './patient.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    permissions: string[];
  };
}

@Controller('patients')
@UseGuards(AuthGuard('jwt'))
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'create')
  async create(@Body() dto: CreatePatientDto): Promise<PatientResponse> {
    return toPatientResponse(await this.patientService.create(dto));
  }

  @Post('me')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'create:own')
  async createMyPatient(@Body() dto: RegisterPatientDto, @Req() req: RequestWithUser): Promise<PatientResponse> {
    return toPatientResponse(await this.patientService.registerPatientForUser(req.user.userId, dto));
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
  async updateMyPatient(@Req() req: RequestWithUser, @Body() dto: UpdatePatientDto): Promise<PatientResponse> {
    const patient = await this.patientService.findByUserId(req.user.userId);
    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }
    return toPatientResponse(await this.patientService.update(patient.id, dto));
  }

  @Get('search')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'read')
  async search(@Query('q') query: string, @Query('limit') limit?: string): Promise<PatientResponse[]> {
    const patients = await this.patientService.search(query, parseInt(limit || '20'));
    return patients.map(toPatientResponse);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'read')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<PatientResponse> {
    return toPatientResponse(await this.patientService.findById(id));
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'update')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePatientDto): Promise<PatientResponse> {
    return toPatientResponse(await this.patientService.update(id, dto));
  }
}
