import { Module } from '@nestjs/common';
import { PermissionsPrismaService } from './infrastructure/db/prisma.service';
import { PrismaPermissionRepository } from './infrastructure/repositories/prisma-permission.repository';
import { PermissionService } from './application/services/permission.service';
import { PERMISSION_REPOSITORY } from './domain/repositories/permission-repository.port';

@Module({
  providers: [
    PermissionsPrismaService,
    PermissionService,
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PrismaPermissionRepository,
    },
  ],
  exports: [PermissionService, PERMISSION_REPOSITORY, PermissionsPrismaService],
})
export class PermissionsModule {}
