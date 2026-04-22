import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@identity/domain/entities/user.entity';

@Controller('system')
@UseGuards(AuthGuard('jwt'))
export class SystemController {
  @Get('permissions')
  getPermissions() {
    return {
      roles: Object.values(UserRole),
      permissions: Object.values(Permission),
      rolePermissions: ROLE_PERMISSIONS,
    };
  }
}