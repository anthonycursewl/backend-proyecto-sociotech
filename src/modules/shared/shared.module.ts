import { Module, Global } from '@nestjs/common';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { SeederService } from './infrastructure/seeder.service';
import { RolesModule } from '../roles/roles.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Global()
@Module({
  imports: [RolesModule, PermissionsModule],
  providers: [RolesGuard, PermissionsGuard, SeederService],
  exports: [RolesGuard, PermissionsGuard, SeederService, RolesModule, PermissionsModule],
})
export class SharedModule {}