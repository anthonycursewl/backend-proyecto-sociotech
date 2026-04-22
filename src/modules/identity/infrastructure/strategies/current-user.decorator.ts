import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { User } from '@identity/domain/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return data ? user[data] : user;
  },
);

export const UserId = createParamDecorator(
  (data: undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return user.id;
  },
);

export const UserRole = createParamDecorator(
  (data: undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return user.role;
  },
);