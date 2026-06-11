import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Logger,
  forwardRef,
} from '@nestjs/common';
import {
  MEDICAL_RECORD_REPOSITORY,
  CursorPagination,
} from '../../domain/repositories/medical-record-repository.port';
import type { MedicalRecordRepository } from '../../domain/repositories/medical-record-repository.port';
import { DOCTOR_REPOSITORY } from '../../domain/repositories/doctor-repository.port';
import type { DoctorRepository } from '../../domain/repositories/doctor-repository.port';
import { MedicalRecord } from '../../domain/entities/medical-record.entity';
import type { PrescriptionProps } from '../../domain/entities/medical-record.entity';
import type {
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
  MedicalRecordResponse,
} from '../../presentation/controllers/medical-record.dto';
import { PatientService } from '../../../patient/application/services/patient.service';
import { AppointmentService } from '../../../appointments/application/services/appointment.service';

@Injectable()
export class MedicalRecordService {
  private readonly logger = new Logger(MedicalRecordService.name);

  constructor(
    @Inject(MEDICAL_RECORD_REPOSITORY)
    private readonly recordRepo: MedicalRecordRepository,
    @Inject(DOCTOR_REPOSITORY) private readonly doctorRepo: DoctorRepository,
    private readonly patientService: PatientService,
    @Inject(forwardRef(() => AppointmentService))
    private readonly appointmentService: AppointmentService,
  ) {}

  async create(
    dto: CreateMedicalRecordDto,
    userId?: string,
  ): Promise<MedicalRecordResponse> {
    const doctor = await this.doctorRepo.findById(dto.doctorId);
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (dto.appointmentId) {
      const existing = await this.recordRepo.findByAppointmentId(
        dto.appointmentId,
      );
      if (existing) {
        throw new BadRequestException(
          'A medical record already exists for this appointment',
        );
      }
    }

    const vs = dto.vitalSigns;
    const prescriptions: PrescriptionProps[] = (dto.prescriptions ?? []).map(
      (p) => ({
        id: crypto.randomUUID(),
        medicalRecordId: '',
        medicationName: p.medicationName,
        dosage: p.dosage ?? null,
        frequency: p.frequency ?? null,
        duration: p.duration ?? null,
        instructions: p.instructions ?? null,
        createdAt: new Date(),
      }),
    );

    const record = new MedicalRecord({
      id: crypto.randomUUID(),
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      appointmentId: dto.appointmentId ?? null,
      chiefComplaint: dto.chiefComplaint,
      symptoms: dto.symptoms,
      diagnosis: dto.diagnosis,
      diagnosisCode: dto.diagnosisCode ?? null,
      treatment: dto.treatment,
      notes: dto.notes,
      isSigned: false,
      signedAt: null,
      bloodPressure: vs?.bloodPressure ?? null,
      heartRate: vs?.heartRate ?? null,
      temperature: vs?.temperature ?? null,
      weight: vs?.weight ?? null,
      height: vs?.height ?? null,
      respiratoryRate: vs?.respiratoryRate ?? null,
      oxygenSaturation: vs?.oxygenSaturation ?? null,
      prescriptions,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.recordRepo.save(record);

    if (dto.appointmentId && userId) {
      try {
        await this.appointmentService.complete(dto.appointmentId, userId);
      } catch (err) {
        this.logger.warn(
          `Failed to auto-complete appointment ${dto.appointmentId} after HC creation: ${err instanceof Error ? err.message : 'unknown'}`,
        );
      }
    }

    return saved.toPlain() as MedicalRecordResponse;
  }

  async findById(id: string): Promise<MedicalRecordResponse> {
    const record = await this.recordRepo.findById(id);
    if (!record) {
      throw new NotFoundException('Medical record not found');
    }
    return record.toPlain() as MedicalRecordResponse;
  }

  async findByPatientId(
    patientId: string,
    pagination?: CursorPagination,
  ): Promise<MedicalRecordResponse[]> {
    const records = await this.recordRepo.findByPatientId(
      patientId,
      pagination,
    );
    return records.map((r) => r.toPlain() as MedicalRecordResponse);
  }

  async findByDoctorId(
    doctorId: string,
    pagination?: CursorPagination,
  ): Promise<MedicalRecordResponse[]> {
    const records = await this.recordRepo.findByDoctorId(doctorId, pagination);
    return records.map((r) => r.toPlain() as MedicalRecordResponse);
  }

  async findByAppointmentId(
    appointmentId: string,
  ): Promise<MedicalRecordResponse | null> {
    const record = await this.recordRepo.findByAppointmentId(appointmentId);
    return record ? (record.toPlain() as MedicalRecordResponse) : null;
  }

  async findMyRecords(userId: string): Promise<MedicalRecordResponse[]> {
    const patient = await this.patientService.findByUserId(userId);
    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }
    const records = await this.recordRepo.findByPatientId(patient.id);
    return records.map((r) => r.toPlain() as MedicalRecordResponse);
  }

  async update(
    id: string,
    dto: UpdateMedicalRecordDto,
  ): Promise<MedicalRecordResponse> {
    const record = await this.recordRepo.findById(id);
    if (!record) {
      throw new NotFoundException('Medical record not found');
    }
    if (record.isSigned) {
      throw new BadRequestException('Cannot update a signed medical record');
    }
    const vs = dto.vitalSigns;
    const prescriptions: PrescriptionProps[] | undefined =
      dto.prescriptions?.map((p) => ({
        id: crypto.randomUUID(),
        medicalRecordId: record.id,
        medicationName: p.medicationName,
        dosage: p.dosage ?? null,
        frequency: p.frequency ?? null,
        duration: p.duration ?? null,
        instructions: p.instructions ?? null,
        createdAt: new Date(),
      }));

    record.updateContent(
      dto.chiefComplaint ?? record.chiefComplaint,
      dto.symptoms ?? record.symptoms,
      dto.diagnosis ?? record.diagnosis,
      dto.diagnosisCode ?? record.diagnosisCode,
      dto.treatment ?? record.treatment,
      dto.notes ?? record.notes,
      vs?.bloodPressure ?? record.bloodPressure,
      vs?.heartRate ?? record.heartRate,
      vs?.temperature ?? record.temperature,
      vs?.weight ?? record.weight,
      vs?.height ?? record.height,
      vs?.respiratoryRate ?? record.respiratoryRate,
      vs?.oxygenSaturation ?? record.oxygenSaturation,
      prescriptions,
    );
    const updated = await this.recordRepo.update(record);
    return updated.toPlain() as MedicalRecordResponse;
  }

  async sign(id: string): Promise<MedicalRecordResponse> {
    const record = await this.recordRepo.findById(id);
    if (!record) {
      throw new NotFoundException('Medical record not found');
    }
    record.sign();
    const updated = await this.recordRepo.update(record);
    return updated.toPlain() as MedicalRecordResponse;
  }

  async delete(id: string): Promise<void> {
    const record = await this.recordRepo.findById(id);
    if (!record) {
      throw new NotFoundException('Medical record not found');
    }
    await this.recordRepo.delete(id);
  }
}
