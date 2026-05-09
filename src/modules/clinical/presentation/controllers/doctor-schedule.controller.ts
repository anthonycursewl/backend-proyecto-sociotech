import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorScheduleService } from '@clinical/application/services/doctor-schedule.service';
import { DoctorService } from '@clinical/application/services/doctor.service';
import { CreateDoctorScheduleDto, UpdateDoctorScheduleDto } from '@clinical/presentation/controllers/doctor-schedule.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';

@Controller('doctors')
export class DoctorScheduleController {
  constructor(
    private readonly scheduleService: DoctorScheduleService,
    private readonly doctorService: DoctorService,
  ) { }

  @Post('me/schedules')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'create:own')
  async createMySchedule(@Body() dto: CreateDoctorScheduleDto, @Req() req) {
    const doctor = await this.doctorService.findByUserId(req.user.userId);
    return this.scheduleService.createSchedule(doctor.id, dto);
  }

  @Get('me/schedules')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'create:own')
  async getMySchedules(@Req() req) {
    const doctor = await this.doctorService.findByUserId(req.user.userId);
    return this.scheduleService.getSchedulesByDoctor(doctor.id);
  }

  @Put('me/schedules/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'create:own')
  async updateMySchedule(@Param('id') id: string, @Body() dto: UpdateDoctorScheduleDto, @Req() req) {
    const doctor = await this.doctorService.findByUserId(req.user.userId);
    const schedule = await this.scheduleService.updateSchedule(id, dto);
    if (schedule.doctorId !== doctor.id) {
      throw new Error('Cannot update another doctor\'s schedule');
    }
    return schedule;
  }

  @Delete('me/schedules/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'create:own')
  async deleteMySchedule(@Param('id') id: string, @Req() req) {
    const doctor = await this.doctorService.findByUserId(req.user.userId);
    const schedule = await this.scheduleService.updateSchedule(id, { isActive: false } as any);
    if (schedule.doctorId !== doctor.id) {
      throw new Error('Cannot delete another doctor\'s schedule');
    }
    return { success: true };
  }

  @Post(':doctorId/schedules')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'manage')
  async createSchedule(@Param('doctorId') doctorId: string, @Body() dto: CreateDoctorScheduleDto) {
    return this.scheduleService.createSchedule(doctorId, dto);
  }

  @Get(':doctorId/schedules')
  async getSchedules(@Param('doctorId') doctorId: string) {
    return this.scheduleService.getSchedulesByDoctor(doctorId);
  }

  @Put(':doctorId/schedules/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'manage')
  async updateSchedule(@Param('id') id: string, @Body() dto: UpdateDoctorScheduleDto) {
    return this.scheduleService.updateSchedule(id, dto);
  }

  @Delete(':doctorId/schedules/:id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('schedules', 'manage')
  async deleteSchedule(@Param('id') id: string) {
    await this.scheduleService.deleteSchedule(id);
    return { success: true };
  }
}