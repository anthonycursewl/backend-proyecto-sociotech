import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PatientService } from '../../application/services/patient.service';
import { CreatePatientDto, UpdatePatientDto, RegisterPatientDto } from './patient.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';

@Controller('patients')
@UseGuards(AuthGuard('jwt'))
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'create')
  async create(@Body() dto: CreatePatientDto) {
    return this.patientService.create(dto);
  }

  @Post('register')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'register')
  async registerPatient(@Body() dto: RegisterPatientDto, @Req() req) {
    return this.patientService.registerPatientForUser(req.user.userId, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'read')
  async findAll() {
    const patients = await this.patientService.findAll();
    return { patients };
  }

  @Get('me')
  async getMyPatient(@Req() req) {
    const patient = await this.patientService.findByUserId(req.user.userId);
    return { patient };
  }

  @Get('search')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'read')
  async search(@Query('q') query: string, @Query('limit') limit?: string) {
    const patients = await this.patientService.search(query, parseInt(limit || '20'));
    return { patients };
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'read')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientService.findById(id);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('patients', 'update')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePatientDto) {
    return this.patientService.update(id, dto);
  }
}