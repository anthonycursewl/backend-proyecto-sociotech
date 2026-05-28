import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, UseInterceptors, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorScheduleService } from '@clinical/application/services/doctor-schedule.service';
import { DoctorService } from '@clinical/application/services/doctor.service';
import {
  CreateDoctorScheduleDto,
  UpdateDoctorScheduleDto,
} from '@clinical/presentation/controllers/doctor-schedule.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import { Audit } from '../../../audit/audit.decorator';
import { AuditInterceptor } from '../../../audit/audit.interceptor';

@Controller('doctors')
@UseInterceptors(AuditInterceptor)
export class DoctorScheduleController {
  constructor(
    private readonly scheduleService: DoctorScheduleService,
    private readonly doctorService: DoctorService,
  ) {}

  @Post('me/schedules')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'create:own')
  @Audit('schedules:create:own', 'DoctorSchedule')
  async createMySchedule(@Body() dto: CreateDoctorScheduleDto, @Req() req) {
    const doctor = await this.doctorService.findByUserId(req.user.userId);
    return this.scheduleService.createSchedule(doctor.id, dto);
  }

  @Get('me/schedules')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'read:own')
  async getMySchedules(@Req() req) {
    const doctor = await this.doctorService.findByUserId(req.user.userId);
    return this.scheduleService.getSchedulesByDoctor(doctor.id);
  }

  @Put('me/schedules/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'update:own')
  @Audit('schedules:update:own', 'DoctorSchedule', true)
  async updateMySchedule(
    @Param('id') id: string,
    @Body() dto: UpdateDoctorScheduleDto,
    @Req() req,
  ) {
    const doctor = await this.doctorService.findByUserId(req.user.userId);
    const oldSchedule = await this.scheduleService.findById(id);
    if (oldSchedule.doctorId !== doctor.id) {
      throw new ForbiddenException("Cannot update another doctor's schedule");
    }
    (req as any).auditSnapshot = { ...oldSchedule };
    return this.scheduleService.updateSchedule(id, dto);
  }

  @Delete('me/schedules/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'delete:own')
  @Audit('schedules:delete:own', 'DoctorSchedule')
  async deleteMySchedule(@Param('id') id: string, @Req() req) {
    const doctor = await this.doctorService.findByUserId(req.user.userId);
    const schedule = await this.scheduleService.findById(id);
    if (schedule.doctorId !== doctor.id) {
      throw new ForbiddenException("Cannot delete another doctor's schedule");
    }
    await this.scheduleService.deleteSchedule(id);
    return { success: true };
  }

  @Post(':doctorId/schedules')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'manage')
  @Audit('schedules:create', 'DoctorSchedule')
  async createSchedule(
    @Param('doctorId') doctorId: string,
    @Body() dto: CreateDoctorScheduleDto,
  ) {
    return this.scheduleService.createSchedule(doctorId, dto);
  }

  @Get(':doctorId/schedules')
  async getSchedules(@Param('doctorId') doctorId: string) {
    return this.scheduleService.getSchedulesByDoctor(doctorId);
  }

  @Put(':doctorId/schedules/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'manage')
  @Audit('schedules:update', 'DoctorSchedule', true)
  async updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateDoctorScheduleDto,
    @Req() req,
  ) {
    (req as any).auditSnapshot = { ...(await this.scheduleService.findById(id)) };
    return this.scheduleService.updateSchedule(id, dto);
  }

  @Delete(':doctorId/schedules/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'manage')
  @Audit('schedules:delete', 'DoctorSchedule')
  async deleteSchedule(@Param('id') id: string) {
    await this.scheduleService.deleteSchedule(id);
    return { success: true };
  }
}
