import { Module } from '@nestjs/common';
import { CreateMedicalRecordUseCase, SignMedicalRecordUseCase } from './application/services';
import { PrismaMedicalRecordRepository } from './infrastructure/repositories/prisma-medical-record.repository';
import { MedicalRecordsController } from './presentation/controllers/medical-records.controller';
import { ReportsController } from './presentation/controllers/reports.controller';
import { PdfGeneratorService } from './infrastructure/pdf/pdf-generator.service';
import { PrismaModule } from '@prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { MEDICAL_RECORD_REPOSITORY } from './domain/ports/medical-record-repository.port';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [MedicalRecordsController, ReportsController],
  providers: [
    CreateMedicalRecordUseCase,
    SignMedicalRecordUseCase,
    PdfGeneratorService,
    {
      provide: MEDICAL_RECORD_REPOSITORY,
      useClass: PrismaMedicalRecordRepository,
    },
  ],
  exports: [
    CreateMedicalRecordUseCase,
    SignMedicalRecordUseCase,
    PdfGeneratorService,
    MEDICAL_RECORD_REPOSITORY,
  ],
})
export class ClinicalModule {}