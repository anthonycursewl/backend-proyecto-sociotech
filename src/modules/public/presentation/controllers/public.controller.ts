import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '@shared/decorators/public.decorator';
import { DoctorService } from '@clinical/application/services/doctor.service';
import { DoctorScheduleService } from '@clinical/application/services/doctor-schedule.service';
import { ServiceService } from '@services/application/services/service.service';
import { DEFAULT_PAGE_SIZE } from '@shared/constants';

@Public()
@UseGuards(AuthGuard('jwt'))
@Controller('public')
export class PublicController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly scheduleService: DoctorScheduleService,
    private readonly serviceService: ServiceService,
  ) {}

  @Get('doctors')
  async listDoctors(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.doctorService.findManyCursor(
      cursor,
      parseInt(limit || String(DEFAULT_PAGE_SIZE)),
      true,
    );
  }

  @Get('doctors/:id')
  async getDoctor(@Param('id') id: string) {
    const doctor = await this.doctorService.findById(id);
    if (!doctor || !doctor.isActive || !doctor.isVisible) {
      throw new NotFoundException('Doctor no encontrado');
    }
    return doctor;
  }

  @Get('doctors/:doctorId/schedules')
  async getDoctorSchedules(@Param('doctorId') doctorId: string) {
    const doctor = await this.doctorService.findById(doctorId);
    if (!doctor || !doctor.isActive || !doctor.isVisible) {
      throw new NotFoundException('Doctor no encontrado');
    }
    return this.scheduleService.getSchedulesByDoctor(doctorId);
  }

  @Get('services')
  async listServices(
    @Query('doctorId') doctorId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.serviceService.findByDoctor(
      doctorId,
      cursor,
      parseInt(limit || String(DEFAULT_PAGE_SIZE)),
    );
  }
}
