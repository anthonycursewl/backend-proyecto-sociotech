import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  StreamableFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import { Audit } from '@audit/audit.decorator';
import { AuditInterceptor } from '@audit/audit.interceptor';
import { PdfService } from '../../pdf.service';

@Controller('pdf')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(AuditInterceptor)
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('prescriptions/:medicalRecordId')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('medical-records', 'read')
  @Audit('pdf:prescription', 'MedicalRecord')
  async getPrescriptionPdf(
    @Param('medicalRecordId', ParseUUIDPipe) medicalRecordId: string,
  ): Promise<StreamableFile> {
    const buffer = await this.pdfService.generatePrescription(medicalRecordId);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `inline; filename="receta-${medicalRecordId.slice(0, 8)}.pdf"`,
    });
  }

  @Get('clinical-history/:patientId')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('medical-records', 'read')
  @Audit('pdf:clinical-history', 'MedicalRecord')
  async getClinicalHistoryPdf(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<StreamableFile> {
    const buffer = await this.pdfService.generateClinicalHistory(patientId);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `inline; filename="historial-${patientId.slice(0, 8)}.pdf"`,
    });
  }

  @Get('appointments/:appointmentId')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'read')
  @Audit('pdf:appointment', 'Appointment')
  async getAppointmentPdf(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ): Promise<StreamableFile> {
    const buffer =
      await this.pdfService.generateAppointmentDetail(appointmentId);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `inline; filename="cita-${appointmentId.slice(0, 8)}.pdf"`,
    });
  }
}
