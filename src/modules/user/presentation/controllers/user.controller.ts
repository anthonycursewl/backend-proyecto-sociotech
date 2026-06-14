import {
  Controller,
  Get,
  Put,
  Delete,
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

import { IsOptional, IsString, IsEmail } from 'class-validator';
import { IsUuidString } from '@shared/validators/is-uuid-string.validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ChangeRoleDto {
  @IsUuidString()
  roleId: string;
}

import { Audit } from '@audit/audit.decorator';
import { AuditInterceptor } from '@audit/audit.interceptor';
import type { RequestWithUser } from '@audit/audit.interceptor';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { CheckPermissions } from '@shared/decorators/permissions.decorator';
import { DEFAULT_PAGE_SIZE } from '@shared/constants';

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
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user!.userId;
    const { user: oldUser } = await this.userService.getProfile(userId);
    req.auditSnapshot = {
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
    @Req() req: RequestWithUser,
  ) {
    const { user: oldUser } = await this.userService.getProfile(userId);
    req.auditSnapshot = {
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
  async getPatients(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit) : undefined;
    return this.userService.getPatientsCursor(cursor, parsedLimit);
  }

  @Get('patients/:patientId')
  async getPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    const patient = await this.userService.getPatientById(patientId);
    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }
    return { patient };
  }

  @Get('doctors')
  async getDoctors(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit) : undefined;
    return this.userService.getDoctorsCursor(cursor, parsedLimit);
  }

  @Get('search')
  async searchUsers(@Query('q') query: string, @Query('limit') limit?: string) {
    const users = await this.userService.searchUsers(
      query,
      parseInt(limit || String(DEFAULT_PAGE_SIZE)),
    );
    return { users };
  }

  @Get('admin/list')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('users', 'read')
  async listUsers(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit) : undefined;
    const parsedActive =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.userService.listUsers({
      cursor,
      limit: parsedLimit,
      isActive: parsedActive,
    });
  }

  @Put('admin/:userId/toggle-active')
  @Audit('users:update', 'User', true)
  @UseGuards(PermissionsGuard)
  @CheckPermissions('users', 'update')
  async toggleActive(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: RequestWithUser,
  ) {
    const { user: oldUser } = await this.userService.getProfile(userId);
    req.auditSnapshot = {
      id: oldUser.id,
      email: oldUser.email,
      firstName: oldUser.firstName,
      lastName: oldUser.lastName,
      isActive: oldUser.isActive,
    };
    return this.userService.toggleUserActive(userId, req.user!.userId);
  }

  @Put('admin/:userId/role')
  @Audit('users:assign-role', 'User', true)
  @UseGuards(PermissionsGuard)
  @CheckPermissions('users', 'assign-role')
  async changeRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ChangeRoleDto,
    @Req() req: RequestWithUser,
  ) {
    const { user: oldUser } = await this.userService.getProfile(userId);
    req.auditSnapshot = {
      id: oldUser.id,
      email: oldUser.email,
      roleId: oldUser.roleId,
      roleName: oldUser.roleName,
    };
    return this.userService.changeUserRole({
      userId,
      roleId: dto.roleId,
      requesterUserId: req.user!.userId,
    });
  }

  @Delete(':id')
  @Audit('users:delete', 'User')
  @UseGuards(PermissionsGuard)
  @CheckPermissions('users', 'delete')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.userService.delete(id, req.user!.userId);
    return { message: 'User deleted successfully' };
  }
}
