import { Module } from '@nestjs/common';
import { PdfController } from './presentation/controllers/pdf.controller';
import { PdfService } from './pdf.service';
import { ClinicalModule } from '../clinical/clinical.module';
import { PatientModule } from '../patient/patient.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [ClinicalModule, PatientModule, AppointmentsModule],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
