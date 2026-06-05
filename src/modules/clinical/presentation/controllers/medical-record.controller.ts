import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MedicalRecordService } from '../../application/services/medical-record.service';
import {
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
} from './medical-record.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import { Audit } from '@audit/audit.decorator';
import { AuditInterceptor } from '@audit/audit.interceptor';
import type { RequestWithUser } from '@audit/audit.interceptor';

@Controller('medical-records')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(AuditInterceptor)
export class MedicalRecordController {
  constructor(private readonly medicalRecordService: MedicalRecordService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('medical-records', 'create')
  @Audit('medical-records:create', 'MedicalRecord')
  async create(
    @Body() dto: CreateMedicalRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.medicalRecordService.create(dto, req.user!.userId);
  }

  @Get('me')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('medical-records', 'read:own')
  async findMyRecords(@Req() req: RequestWithUser) {
    return this.medicalRecordService.findMyRecords(req.user!.userId);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('medical-records', 'read')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicalRecordService.findById(id);
  }

  @Get('patient/:patientId')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('medical-records', 'read')
  async findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.medicalRecordService.findByPatientId(patientId);
  }

  @Get('doctor/:doctorId')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('medical-records', 'read')
  async findByDoctor(@Param('doctorId', ParseUUIDPipe) doctorId: string) {
    return this.medicalRecordService.findByDoctorId(doctorId);
  }

  @Get('appointment/:appointmentId')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('medical-records', 'read')
  async findByAppointment(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.medicalRecordService.findByAppointmentId(appointmentId);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('medical-records', 'update')
  @Audit('medical-records:update', 'MedicalRecord', true)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordService.update(id, dto);
  }

  @Put(':id/sign')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('medical-records', 'sign')
  @Audit('medical-records:sign', 'MedicalRecord')
  async sign(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicalRecordService.sign(id);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('medical-records', 'delete')
  @Audit('medical-records:delete', 'MedicalRecord')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicalRecordService.delete(id);
  }
}
