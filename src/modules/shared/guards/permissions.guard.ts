import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<{ resource: string; action: string }>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.permissions || !Array.isArray(user.permissions)) {
      throw new ForbiddenException('No permissions found for user');
    }

    const permissionName = `${requiredPermissions.resource}:${requiredPermissions.action}`;
    const hasPermission = user.permissions.includes(permissionName);

    if (!hasPermission) {
      throw new ForbiddenException(`Access denied. Required permission: ${permissionName}`);
    }

    return true;
  }
}