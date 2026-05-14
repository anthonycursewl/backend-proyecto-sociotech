import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentService } from '../../application/services/appointment.service';
import {
  CreateAppointmentDto,
  CancelAppointmentDto,
  AvailableSlotsQueryDto,
} from './appointment.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import { Audit } from '../../../audit/audit.decorator';
import { AuditInterceptor } from '../../../audit/audit.interceptor';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(AuditInterceptor)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'create:own')
  @Audit('appointments:create:own', 'Appointment')
  async create(@Body() dto: CreateAppointmentDto, @Req() req) {
    return this.appointmentService.create(req.user.userId, dto);
  }

  @Get('me')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'read:own')
  async getMyAppointments(@Req() req) {
    const appointments = await this.appointmentService.findByPatientId(
      req.user.userId,
    );
    return { appointments };
  }

  @Get('available-slots')
  async getAvailableSlots(@Query() query: AvailableSlotsQueryDto) {
    const slots = await this.appointmentService.getAvailableSlots(
      query.doctorId,
      query.serviceId,
      query.date,
    );
    return { slots };
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'read')
  async getAllAppointments() {
    return this.appointmentService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.findById(id);
  }

  @Put(':id/cancel')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'cancel:own')
  @Audit('appointments:cancel', 'Appointment')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
    @Req() req,
  ) {
    return this.appointmentService.cancel(id, req.user.userId, dto);
  }
}
