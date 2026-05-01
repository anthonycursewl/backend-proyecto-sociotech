import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/db/prisma.service';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UserService } from './application/services/user.service';
import { UserController } from './presentation/controllers/user.controller';
import { USER_REPOSITORY } from './domain/repositories/user-repository.port';
import { RedisEventBus } from './infrastructure/events/redis-event-bus';
import { UserEventSubscriber } from './infrastructure/events/user-event.subscriber';

@Module({
  controllers: [UserController],
  providers: [
    PrismaService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    UserService,
    RedisEventBus,
    UserEventSubscriber,
  ],
  exports: [UserService],
})
export class UserModule {}
