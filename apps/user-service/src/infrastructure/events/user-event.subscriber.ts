import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisEventBus, DomainEvent } from './redis-event-bus';
import { USER_REPOSITORY } from '../../domain/repositories/user-repository.port';
import { Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user-repository.port';

@Injectable()
export class UserEventSubscriber implements OnModuleInit {
  private readonly logger = new Logger(UserEventSubscriber.name);

  constructor(
    private readonly eventBus: RedisEventBus,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async onModuleInit() {
    this.logger.log('===========================================');
    this.logger.log('Starting user event subscriber...');
    this.logger.log('Will listen to stream: user:events');
    this.logger.log('===========================================');

    await this.eventBus.subscribe(
      'user:events',
      'user-service-group',
      'user-service-consumer',
      this.handleUserEvent.bind(this),
    );

    this.logger.log('User event subscriber started - waiting for events...');
  }

  private async handleUserEvent(event: DomainEvent): Promise<void> {
    this.logger.log(`[EVENT RECEIVED] Type: ${event.eventType}, Stream: ${event.streamName}`);
    this.logger.log(`[EVENT PAYLOAD] ${JSON.stringify(event.payload)}`);

    try {
      if (event.eventType === 'USER_REGISTERED') {
        const { id, email, passwordHash, firstName, lastName, role } = event.payload as {
          id: string;
          email: string;
          passwordHash: string;
          firstName: string;
          lastName: string;
          role: string;
        };

        this.logger.log(`[USER_REGISTERED] Processing user: ${id} - ${email}`);
        this.logger.log(`[USER_REGISTERED] passwordHash received: ${passwordHash ? 'yes' : 'no'}`);

        const existing = await this.userRepo.findById(id);
        if (existing) {
          this.logger.warn(`[USER_REGISTERED] User ${id} already exists, skipping`);
          return;
        }

        this.logger.log(`[USER_REGISTERED] Creating user in user-service DB...`);

        const user = {
          id,
          email,
          passwordHash,
          firstName,
          lastName,
          role,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await this.userRepo.save(user as any);
        this.logger.log(`[USER_REGISTERED] SUCCESS - User ${id} replicated to user-service`);
      } else {
        this.logger.warn(`[UNKNOWN EVENT] ${event.eventType}`);
      }
    } catch (error) {
      this.logger.error(`[EVENT ERROR] ${error.message}`, error.stack);
    }
  }
}