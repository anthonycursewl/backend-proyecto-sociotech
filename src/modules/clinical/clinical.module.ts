import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/db/prisma.service';
import { DoctorController } from './presentation/controllers/doctor.controller';
import { DoctorScheduleController } from './presentation/controllers/doctor-schedule.controller';
import { DoctorService } from './application/services/doctor.service';
import { DoctorScheduleService } from './application/services/doctor-schedule.service';
import { DOCTOR_REPOSITORY } from './domain/repositories/doctor-repository.port';
import { DOCTOR_SCHEDULE_REPOSITORY } from './domain/repositories/doctor-schedule-repository.port';
import { PrismaDoctorRepository } from './infrastructure/repositories/prisma-doctor.repository';
import { PrismaDoctorScheduleRepository } from './infrastructure/repositories/prisma-doctor-schedule.repository';

@Module({
  imports: [],
  controllers: [DoctorController, DoctorScheduleController],
  providers: [
    PrismaService,
    DoctorService,
    DoctorScheduleService,
    {
      provide: DOCTOR_REPOSITORY,
      useClass: PrismaDoctorRepository,
    },
    {
      provide: DOCTOR_SCHEDULE_REPOSITORY,
      useClass: PrismaDoctorScheduleRepository,
    },
  ],
  exports: [PrismaService],
})
export class ClinicalModule {}
