import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorService } from '@clinical/application/services/doctor.service';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
} from '@clinical/presentation/controllers/doctor.dto';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import { Audit } from '../../../audit/audit.decorator';
import { AuditInterceptor } from '../../../audit/audit.interceptor';

@Controller('doctors')
@UseInterceptors(AuditInterceptor)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post('profile')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'create:own')
  @Audit('doctors:create:own', 'Doctor')
  async createProfile(@Body() dto: CreateDoctorDto, @Req() req) {
    return this.doctorService.create(req.user.userId, dto);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'manage')
  @Audit('doctors:create', 'Doctor')
  async create(@Body() dto: CreateDoctorDto, @Req() req) {
    return this.doctorService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Query('includeInactive') includeInactive: string) {
    const include = includeInactive === 'true';
    return this.doctorService.findAll(include);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.doctorService.findById(id);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.doctorService.findByUserId(userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'manage')
  @Audit('doctors:update', 'Doctor', true)
  async update(@Param('id') id: string, @Body() dto: UpdateDoctorDto, @Req() req) {
    const old = await this.doctorService.findById(id);
    (req as any).auditSnapshot = old.toPlain();
    return this.doctorService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @CheckPermissions('doctors', 'manage')
  @Audit('doctors:delete', 'Doctor')
  async delete(@Param('id') id: string) {
    return this.doctorService.delete(id);
  }
}
