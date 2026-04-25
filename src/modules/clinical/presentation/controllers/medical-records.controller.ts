import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseUUIDPipe, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateMedicalRecordUseCase } from '../../application/services/create-medical-record.usecase';
import { SignMedicalRecordUseCase } from '../../application/services/sign-medical-record.usecase';
import type { MedicalRecordRepository } from '@clinical/domain/ports/medical-record-repository.port';
import { MEDICAL_RECORD_REPOSITORY } from '@clinical/domain/ports/medical-record-repository.port';
import { RolesGuard } from '@identity/infrastructure/strategies/roles.guard';
import { Roles } from '@identity/infrastructure/strategies/roles.decorator';
import { UserRole } from '@identity/domain/entities/user.entity';

class CreateMedicalRecordDto {
  patientId: string;
  doctorId: string;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string;
  treatment: string;
  notes: string;
}

@Controller('medical-records')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MedicalRecordsController {
  constructor(
    private readonly createMedicalRecordUseCase: CreateMedicalRecordUseCase,
    private readonly signMedicalRecordUseCase: SignMedicalRecordUseCase,
    @Inject(MEDICAL_RECORD_REPOSITORY) private readonly medicalRecordRepository: MedicalRecordRepository,
  ) {}

  @Post()
  @Roles(UserRole.DOCTOR)
  async create(@Body() dto: CreateMedicalRecordDto) {
    return this.createMedicalRecordUseCase.execute(dto);
  }

  @Get('patient/:patientId')
  async findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.medicalRecordRepository.findByPatientId(patientId);
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async findByDoctor(@Param('doctorId', ParseUUIDPipe) doctorId: string) {
    return this.medicalRecordRepository.findByDoctorId(doctorId);
  }

  @Get('unsigned')
  @Roles(UserRole.DOCTOR)
  async findUnsigned() {
    return this.medicalRecordRepository.findUnsignedByDoctorId('');
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicalRecordRepository.findById(id);
  }

  @Put(':id/sign')
  @Roles(UserRole.DOCTOR)
  async sign(@Param('id', ParseUUIDPipe) id: string, @Body('doctorId') doctorId: string) {
    return this.signMedicalRecordUseCase.execute({ recordId: id, doctorId });
  }
}