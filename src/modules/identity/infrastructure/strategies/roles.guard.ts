import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '@identity/domain/entities/user.entity';
import { Permission } from '@identity/domain/entities/user.entity';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasPermission = requiredPermissions.some((permission) =>
      user.hasPermission(permission)
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return hasPermission;
  }
}