import { SetMetadata } from '@nestjs/common';
import { Permission } from '@identity/domain/entities/user.entity';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);