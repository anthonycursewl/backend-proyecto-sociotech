import { Module, Provider } from '@nestjs/common';
import { QUEUE_SERVICE } from './queue.port';
import { RedisQueueService } from './redis-queue.service';
import { InMemoryQueueService } from './in-memory-queue.service';

const queueProvider: Provider = {
  provide: QUEUE_SERVICE,
  useFactory: () => {
    const useRedis =
      process.env.QUEUE_DRIVER !== 'memory' && process.env.REDIS_URL;
    if (useRedis) {
      return new RedisQueueService();
    }
    return new InMemoryQueueService();
  },
};

@Module({
  providers: [queueProvider],
  exports: [queueProvider],
})
export class QueueModule {}
