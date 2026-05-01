import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ServiceService } from '@services/application/services/service.service';
import { ServiceController } from '@services/presentation/controllers/service.controller';
import { PrismaServiceRepository } from '@services/infrastructure/repositories/prisma-service.repository';
import { SERVICE_REPOSITORY } from '@services/domain/repositories/service-repository.port';
import { PrismaService } from '@services/infrastructure/db/prisma.service';

@Module({
  imports: [PassportModule],
  controllers: [ServiceController],
  providers: [
    ServiceService,
    PrismaService,
    {
      provide: SERVICE_REPOSITORY,
      useClass: PrismaServiceRepository,
    },
  ],
  exports: [ServiceService],
})
export class ServicesModule {}
