import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseUUIDPipe, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScheduleAppointmentUseCase } from '../../application/use-cases/schedule-appointment.usecase';
import { CancelAppointmentUseCase } from '../../application/use-cases/cancel-appointment.usecase';
import { RescheduleAppointmentUseCase } from '../../application/use-cases/reschedule-appointment.usecase';
import type { AppointmentRepository } from '@scheduling/domain/ports/appointment-repository.port';
import { APPOINTMENT_REPOSITORY } from '@scheduling/domain/ports/appointment-repository.port';
import { RolesGuard } from '@identity/infrastructure/strategies/roles.guard';
import { Roles } from '@identity/infrastructure/strategies/roles.decorator';
import { UserRole } from '@identity/domain/entities/user.entity';
import { ScheduleAppointmentDto, CancelAppointmentDto, RescheduleAppointmentDto } from './appointments.dto';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AppointmentsController {
  constructor(
    private readonly scheduleAppointmentUseCase: ScheduleAppointmentUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    private readonly rescheduleAppointmentUseCase: RescheduleAppointmentUseCase,
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: AppointmentRepository,
  ) { }

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.SECRETARY)
  async schedule(@Body() dto: ScheduleAppointmentDto) {
    return this.scheduleAppointmentUseCase.execute({
      ...dto,
      scheduledAt: new Date(dto.scheduledAt),
    });
  }

  @Get('patient/:patientId')
  async findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.appointmentRepository.findByPatientId(patientId);
  }

  @Get('doctor/:doctorId')
  async findByDoctor(@Param('doctorId', ParseUUIDPipe) doctorId: string) {
    return this.appointmentRepository.findByDoctorId(doctorId);
  }

  @Get('range')
  async findByDateRange(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ) {
    return this.appointmentRepository.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentRepository.findById(id);
  }

  @Put(':id/cancel')
  @Roles(UserRole.DOCTOR, UserRole.SECRETARY)
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelAppointmentDto) {
    return this.cancelAppointmentUseCase.execute({
      appointmentId: id,
      ...dto,
    });
  }

  @Put(':id/reschedule')
  @Roles(UserRole.DOCTOR, UserRole.SECRETARY)
  async reschedule(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.rescheduleAppointmentUseCase.execute({
      appointmentId: id,
      newScheduledAt: new Date(dto.newScheduledAt),
    });
  }
}