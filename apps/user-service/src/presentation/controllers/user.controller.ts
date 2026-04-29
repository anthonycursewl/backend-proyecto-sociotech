import { Controller, Get, Put, Body, Param, Query, UseGuards, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService, UpdateProfileInput } from '../../application/services/user.service';
import { User } from '../../domain/entities/user.entity';

export class UpdateProfileDto {
  firstName?: string;
  lastName?: string;
}

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile/:userId')
  async getProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userService.getProfile(userId);
  }

  @Put('profile/:userId')
  async updateProfile(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
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
    const users = await this.userService.searchUsers(query, parseInt(limit || '20'));
    return { users };
  }
}
