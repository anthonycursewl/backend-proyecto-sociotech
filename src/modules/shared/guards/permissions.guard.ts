import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<{
      resource: string;
      action: string;
    }>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (!user.permissions || !Array.isArray(user.permissions)) {
      throw new ForbiddenException('No se encontraron permisos para el usuario');
    }

    const { resource, action } = requiredPermissions;
    const hasPermission = user.permissions.some((userPerm) => {
      if (userPerm === `${resource}:${action}`) {
        return true;
      }

      if (
        !action.includes(':') &&
        (userPerm === `${resource}:${action}` ||
          userPerm.startsWith(`${resource}:${action}:`) ||
          userPerm.startsWith(`${resource}:${action}/`))
      ) {
        return true;
      }

      return false;
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Acceso denegado. Permiso requerido: ${resource}:${action}`,
      );
    }

    return true;
  }
}
