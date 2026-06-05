import { Module, forwardRef } from '@nestjs/common';
import { AppointmentController } from './presentation/controllers/appointment.controller';
import { AppointmentService } from './application/services/appointment.service';
import { DoctorAvailabilityService } from './application/services/doctor-availability.service';
import { PrismaAppointmentRepository } from './infrastructure/repositories/prisma-appointment.repository';
import { AppointmentsPrismaService } from './infrastructure/db/prisma.service';
import { APPOINTMENT_REPOSITORY } from './domain/repositories/appointment-repository.port';
import { PatientModule } from '../patient/patient.module';
import { ServicesModule } from '../services/services.module';
import { ClinicalModule } from '../clinical/clinical.module';

@Module({
  imports: [PatientModule, ServicesModule, forwardRef(() => ClinicalModule)],
  controllers: [AppointmentController],
  providers: [
    AppointmentsPrismaService,
    AppointmentService,
    DoctorAvailabilityService,
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: PrismaAppointmentRepository,
    },
  ],
  exports: [AppointmentService, DoctorAvailabilityService, APPOINTMENT_REPOSITORY],
})
export class AppointmentsModule {}
