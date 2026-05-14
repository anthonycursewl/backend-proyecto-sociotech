import { Module } from '@nestjs/common';
import { RolesPrismaService } from './infrastructure/db/prisma.service';
import { PrismaRoleRepository } from './infrastructure/repositories/prisma-role.repository';
import { RoleService } from './application/services/role.service';
import { RolesController } from './presentation/controllers/roles.controller';
import { ROLE_REPOSITORY } from './domain/repositories/role-repository.port';

@Module({
  controllers: [RolesController],
  providers: [
    RolesPrismaService,
    RoleService,
    {
      provide: ROLE_REPOSITORY,
      useClass: PrismaRoleRepository,
    },
  ],
  exports: [RoleService, ROLE_REPOSITORY, RolesPrismaService],
})
export class RolesModule {}
