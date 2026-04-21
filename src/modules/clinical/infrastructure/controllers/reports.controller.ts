import { Controller, Get, Param, Res, UseGuards, ParseUUIDPipe, Inject } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { PdfGeneratorService, MedicalReportData } from '../pdf/pdf-generator.service';
import type { MedicalRecordRepository } from '@clinical/domain/ports/medical-record-repository.port';
import { MEDICAL_RECORD_REPOSITORY } from '@clinical/domain/ports/medical-record-repository.port';
import type { UserRepository } from '@identity/domain/ports/user-repository.port';
import { USER_REPOSITORY } from '@identity/domain/ports/user-repository.port';
import { RolesGuard } from '@identity/infrastructure/strategies/roles.guard';
import { Roles } from '@identity/infrastructure/strategies/roles.decorator';
import { UserRole } from '@identity/domain/entities/user.entity';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(
    private readonly pdfGeneratorService: PdfGeneratorService,
    @Inject(MEDICAL_RECORD_REPOSITORY) private readonly medicalRecordRepository: MedicalRecordRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  @Get('medical-record/:recordId')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async getMedicalReport(
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Res() res: Response,
  ) {
    const record = await this.medicalRecordRepository.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    const doctor = await this.userRepository.findById(record.doctorId);
    const patientUser = await this.userRepository.findById(record.patientId);

    if (!doctor || !patientUser) {
      return res.status(404).json({ error: 'Doctor or patient not found' });
    }

    const patientData = {
      id: patientUser.id,
      userId: patientUser.id,
      medicalId: `MED-${patientUser.id.substring(0, 8)}`,
      dateOfBirth: new Date(),
      phone: 'N/A',
      address: 'N/A',
      emergencyContact: 'N/A',
      emergencyPhone: 'N/A',
      bloodType: null,
      allergies: [] as string[],
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: patientUser.firstName,
      lastName: patientUser.lastName,
    };

    const data: MedicalReportData = {
      record,
      doctor,
      patient: patientData as any,
      generatedAt: new Date(),
    };

    const pdfBuffer = await this.pdfGeneratorService.generateMedicalReport(data);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="medical-report-${recordId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}