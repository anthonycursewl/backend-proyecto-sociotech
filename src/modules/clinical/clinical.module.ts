import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/db/prisma.service';
import { DoctorController } from './presentation/controllers/doctor.controller';
import { DoctorService } from './application/services/doctor.service';
import { DOCTOR_REPOSITORY } from './domain/repositories/doctor-repository.port';
import { PrismaDoctorRepository } from './infrastructure/repositories/prisma-doctor.repository';

@Module({
  imports: [],
  controllers: [DoctorController],
  providers: [
    PrismaService,
    DoctorService,
    {
      provide: DOCTOR_REPOSITORY,
      useClass: PrismaDoctorRepository,
    },
  ],
  exports: [PrismaService],
})
export class ClinicalModule {}
