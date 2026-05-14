import { Module } from '@nestjs/common';
import { AppointmentController } from './presentation/controllers/appointment.controller';
import { AppointmentService } from './application/services/appointment.service';
import { PrismaAppointmentRepository } from './infrastructure/repositories/prisma-appointment.repository';
import { AppointmentsPrismaService } from './infrastructure/db/prisma.service';
import { APPOINTMENT_REPOSITORY } from './domain/repositories/appointment-repository.port';

@Module({
  controllers: [AppointmentController],
  providers: [
    AppointmentsPrismaService,
    AppointmentService,
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: PrismaAppointmentRepository,
    },
  ],
  exports: [AppointmentService, APPOINTMENT_REPOSITORY],
})
export class AppointmentsModule {}
