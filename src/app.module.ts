import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ClinicalModule } from './modules/clinical/clinical.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { SharedModule } from './modules/shared/shared.module';

@Module({
  imports: [
    PrismaModule,
    IdentityModule,
    ClinicalModule,
    SchedulingModule,
    SharedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}