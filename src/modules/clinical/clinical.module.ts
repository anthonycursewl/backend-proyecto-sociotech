import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from './infrastructure/db/prisma.service';
import { DoctorController } from './presentation/controllers/doctor.controller';
import { DoctorScheduleController } from './presentation/controllers/doctor-schedule.controller';
import { MedicalRecordController } from './presentation/controllers/medical-record.controller';
import { DoctorService } from './application/services/doctor.service';
import { DoctorScheduleService } from './application/services/doctor-schedule.service';
import { MedicalRecordService } from './application/services/medical-record.service';
import { DOCTOR_REPOSITORY } from './domain/repositories/doctor-repository.port';
import { DOCTOR_SCHEDULE_REPOSITORY } from './domain/repositories/doctor-schedule-repository.port';
import { MEDICAL_RECORD_REPOSITORY } from './domain/repositories/medical-record-repository.port';
import { PrismaDoctorRepository } from './infrastructure/repositories/prisma-doctor.repository';
import { PrismaDoctorScheduleRepository } from './infrastructure/repositories/prisma-doctor-schedule.repository';
import { PrismaMedicalRecordRepository } from './infrastructure/repositories/prisma-medical-record.repository';
import { PatientModule } from '../patient/patient.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [PatientModule, forwardRef(() => AppointmentsModule)],
  controllers: [
    DoctorController,
    DoctorScheduleController,
    MedicalRecordController,
  ],
  providers: [
    PrismaService,
    DoctorService,
    DoctorScheduleService,
    MedicalRecordService,
    {
      provide: DOCTOR_REPOSITORY,
      useClass: PrismaDoctorRepository,
    },
    {
      provide: DOCTOR_SCHEDULE_REPOSITORY,
      useClass: PrismaDoctorScheduleRepository,
    },
    {
      provide: MEDICAL_RECORD_REPOSITORY,
      useClass: PrismaMedicalRecordRepository,
    },
  ],
  exports: [
    PrismaService,
    DoctorService,
    DoctorScheduleService,
    MedicalRecordService,
  ],
})
export class ClinicalModule {}
