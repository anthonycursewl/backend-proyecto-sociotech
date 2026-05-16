import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  UserService,
  UpdateProfileInput,
} from '../../application/services/user.service';
import { User } from '../../domain/entities/user.entity';

import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

import { Audit } from '../../../audit/audit.decorator';
import { AuditInterceptor } from '../../../audit/audit.interceptor';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(AuditInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile/:userId')
  async getProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userService.getProfile(userId);
  }

  @Put('me/profile')
  @Audit('users:update', 'User', true)
  async updateMyProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req,
  ) {
    const userId = req.user.userId;
    const { user: oldUser } = await this.userService.getProfile(userId);
    (req as any).auditSnapshot = {
      id: oldUser.id,
      email: oldUser.email,
      firstName: oldUser.firstName,
      lastName: oldUser.lastName,
      isActive: oldUser.isActive,
    };
    return this.userService.updateProfile({
      userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }

  @Put('profile/:userId')
  @Audit('users:update', 'User', true)
  async updateProfile(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateProfileDto,
    @Req() req,
  ) {
    const { user: oldUser } = await this.userService.getProfile(userId);
    (req as any).auditSnapshot = {
      id: oldUser.id,
      email: oldUser.email,
      firstName: oldUser.firstName,
      lastName: oldUser.lastName,
      isActive: oldUser.isActive,
    };
    return this.userService.updateProfile({
      userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }

  @Get('patients')
  async getPatients() {
    const patients = await this.userService.getPatients();
    return { patients };
  }

  @Get('patients/:patientId')
  async getPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    const patient = await this.userService.getPatientById(patientId);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return { patient };
  }

  @Get('doctors')
  async getDoctors() {
    const doctors = await this.userService.getDoctors();
    return { doctors };
  }

  @Get('search')
  async searchUsers(@Query('q') query: string, @Query('limit') limit?: string) {
    const users = await this.userService.searchUsers(
      query,
      parseInt(limit || '20'),
    );
    return { users };
  }
}
