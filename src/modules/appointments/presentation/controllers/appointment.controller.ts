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
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentService } from '../../application/services/appointment.service';
import {
  CreateAppointmentDto,
  CancelAppointmentDto,
  RescheduleAppointmentDto,
  AvailableSlotsQueryDto,
  MonthAvailabilityQueryDto,
  AppointmentResponseDto,
  GetMyAppointmentsQueryDto,
  GetAllAppointmentsQueryDto,
} from './appointment.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import { Audit } from '@audit/audit.decorator';
import { AuditInterceptor } from '@audit/audit.interceptor';
import type { RequestWithUser } from '@audit/audit.interceptor';
import { ENTITY_CACHE_TTL } from '@shared/constants';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(AuditInterceptor)
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'create:own')
  @Audit('appointments:create:own', 'Appointment')
  async create(
    @Body() dto: CreateAppointmentDto,
    @Req() req: RequestWithUser,
  ): Promise<AppointmentResponseDto> {
    const apt = await this.appointmentService.create(req.user!.userId, dto);
    return AppointmentResponseDto.fromEntity(apt);
  }

  @Get('me')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'read:own')
  async getMyAppointments(
    @Req() req: RequestWithUser,
    @Query() query: GetMyAppointmentsQueryDto,
  ): Promise<AppointmentResponseDto[]> {
    const appointments = await this.appointmentService.getMyAppointments(
      req.user!.userId,
      query.filter,
    );
    return AppointmentResponseDto.fromEntities(appointments);
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

  @Get('available-slots/month')
  async getMonthAvailability(@Query() query: MonthAvailabilityQueryDto) {
    const days = await this.appointmentService.getMonthAvailability(
      query.doctorId,
      query.serviceId,
      query.year,
      query.month,
    );
    return { days };
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'read')
  async getAllAppointments(
    @Query() query: GetAllAppointmentsQueryDto,
  ): Promise<AppointmentResponseDto[]> {
    const appointments = await this.appointmentService.findAll(
      query.filter,
      query.doctorId,
    );
    return AppointmentResponseDto.fromEntities(appointments);
  }

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AppointmentResponseDto> {
    const cacheKey = `appointment:${id}`;
    const cached = await this.cacheManager.get<AppointmentResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }
    const apt = await this.appointmentService.findById(id);
    const result = AppointmentResponseDto.fromEntity(apt);
    await this.cacheManager.set(cacheKey, result, ENTITY_CACHE_TTL);
    return result;
  }

  @Put(':id/confirm')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'update')
  @Audit('appointments:confirm', 'Appointment')
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<AppointmentResponseDto> {
    const apt = await this.appointmentService.confirmAppointment(
      id,
      req.user!.userId,
    );
    await this.cacheManager.del(`appointment:${id}`);
    return AppointmentResponseDto.fromEntity(apt);
  }

  @Put(':id/complete')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'update')
  @Audit('appointments:complete', 'Appointment')
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<AppointmentResponseDto> {
    const apt = await this.appointmentService.complete(id, req.user!.userId);
    await this.cacheManager.del(`appointment:${id}`);
    return AppointmentResponseDto.fromEntity(apt);
  }

  @Put(':id/no-show')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'update')
  @Audit('appointments:no-show', 'Appointment')
  async noShow(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<AppointmentResponseDto> {
    const apt = await this.appointmentService.markNoShow(id, req.user!.userId);
    await this.cacheManager.del(`appointment:${id}`);
    return AppointmentResponseDto.fromEntity(apt);
  }

  @Put(':id/reschedule')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'update:own')
  @Audit('appointments:reschedule', 'Appointment')
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleAppointmentDto,
    @Req() req: RequestWithUser,
  ): Promise<AppointmentResponseDto> {
    const apt = await this.appointmentService.reschedule(
      id,
      req.user!.userId,
      dto,
    );
    await this.cacheManager.del(`appointment:${id}`);
    return AppointmentResponseDto.fromEntity(apt);
  }

  @Put(':id/cancel')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'cancel:own')
  @Audit('appointments:cancel', 'Appointment')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
    @Req() req: RequestWithUser,
  ): Promise<AppointmentResponseDto> {
    const apt = await this.appointmentService.cancel(id, req.user!.userId, dto);
    return AppointmentResponseDto.fromEntity(apt);
  }

  @Put(':id/doctor-cancel')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('appointments', 'cancel')
  @Audit('appointments:cancel', 'Appointment')
  async doctorCancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
    @Req() req: RequestWithUser,
  ): Promise<AppointmentResponseDto> {
    const apt = await this.appointmentService.doctorCancel(
      id,
      req.user!.userId,
      dto,
    );
    return AppointmentResponseDto.fromEntity(apt);
  }

}
