import { Module } from '@nestjs/common';
import { PatientController } from './presentation/controllers/patient.controller';
import { PatientService } from './application/services/patient.service';
import { PrismaPatientRepository } from './infrastructure/repositories/prisma-patient.repository';
import { PatientPrismaService } from './infrastructure/db/prisma.service';
import { PATIENT_REPOSITORY } from './domain/repositories/patient-repository.port';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [PatientController],
  providers: [
    PatientService,
    PatientPrismaService,
    {
      provide: PATIENT_REPOSITORY,
      useClass: PrismaPatientRepository,
    },
  ],
  exports: [PatientService],
})
export class PatientModule {}
