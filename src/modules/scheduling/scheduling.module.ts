import { Module } from '@nestjs/common';
import { ScheduleAppointmentUseCase, CancelAppointmentUseCase, RescheduleAppointmentUseCase } from './application/services';
import { PrismaAppointmentRepository } from './infrastructure/repositories/prisma-appointment.repository';
import { AppointmentsController } from './presentation/controllers/appointments.controller';
import { PrismaModule } from '@prisma/prisma.module';
import { APPOINTMENT_REPOSITORY } from './domain/ports/appointment-repository.port';

@Module({
  imports: [PrismaModule],
  controllers: [AppointmentsController],
  providers: [
    ScheduleAppointmentUseCase,
    CancelAppointmentUseCase,
    RescheduleAppointmentUseCase,
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: PrismaAppointmentRepository,
    },
  ],
  exports: [
    ScheduleAppointmentUseCase,
    CancelAppointmentUseCase,
    RescheduleAppointmentUseCase,
    APPOINTMENT_REPOSITORY,
  ],
})
export class SchedulingModule {}