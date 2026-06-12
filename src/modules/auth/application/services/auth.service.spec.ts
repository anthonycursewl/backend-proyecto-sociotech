import { randomInt } from 'crypto';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';
import { User } from '@user/domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user-repository.port';
import type { BcryptAuthService } from '../../infrastructure/strategies/bcrypt-auth.service';
import type { IQueueService } from '../../../queue/queue.port';
import type { RedisEventBus } from '../../infrastructure/events';
import {
  NOTIFICATION_STREAM,
  NotificationType,
} from '../../../notifications/domain/notification.types';

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return { ...actual, randomInt: jest.fn() };
});

const MOCK_CODE = '123456';

describe('AuthService — forgotPassword / resetPassword', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<UserRepository>;
  let bcryptAuth: jest.Mocked<BcryptAuthService>;
  let queue: jest.Mocked<IQueueService>;
  let prisma: any;
  let jwtService: any;
  let eventBus: jest.Mocked<RedisEventBus>;
  let configService: any;

  const mockUser = new User({
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'old-hash',
    roleId: 'role-1',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    (randomInt as jest.Mock).mockReturnValue(123456);

    userRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdWithRole: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      updateRoleId: jest.fn(),
      updateRefreshToken: jest.fn(),
      search: jest.fn(),
      findDefaultPatientRoleId: jest.fn(),
    };

    bcryptAuth = {
      hashPassword: jest.fn().mockResolvedValue('new-hash'),
      comparePassword: jest.fn().mockResolvedValue(true),
    } as any;

    queue = {
      publish: jest.fn().mockResolvedValue('msg-id'),
      consume: jest.fn(),
      ack: jest.fn(),
      ensureGroup: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('token'),
      verify: jest.fn(),
    };

    eventBus = {
      publish: jest.fn(),
    } as any;

    configService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    prisma = {
      emailVerification: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new AuthService(
      userRepo as any,
      bcryptAuth as any,
      jwtService as any,
      prisma as any,
      eventBus as any,
      queue as any,
      configService as any,
    );
  });

  describe('forgotPassword', () => {
    it('returns generic message and publishes PASSWORD_RESET when user exists', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('test@example.com');

      expect(result).toEqual({
        message:
          'Si el correo existe, recibirás un código para restablecer tu contraseña',
      });
      expect(userRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(queue.publish).toHaveBeenCalledWith(
        NOTIFICATION_STREAM,
        expect.objectContaining({
          type: NotificationType.PASSWORD_RESET,
          data: expect.stringContaining('"email":"test@example.com"'),
        }),
      );
    });

    it('returns generic message without publishing when user does not exist', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword('unknown@example.com');

      expect(result).toEqual({
        message:
          'Si el correo existe, recibirás un código para restablecer tu contraseña',
      });
      expect(queue.publish).not.toHaveBeenCalled();
    });

    it('does not throw when queue publish fails', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      queue.publish.mockRejectedValue(new Error('queue down'));

      await expect(
        service.forgotPassword('test@example.com'),
      ).resolves.toBeDefined();
    });

    it('normalizes email to lowercase', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);

      await service.forgotPassword('TEST@Example.COM');

      expect(userRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('resetPassword', () => {
    it('hashes password, updates user, publishes PASSWORD_CHANGED, and deletes code', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      await service.forgotPassword('test@example.com');

      const result = await service.resetPassword(
        'test@example.com',
        MOCK_CODE,
        'NewP@ss123',
      );

      expect(result).toEqual({
        message: 'Contraseña restablecida exitosamente',
      });
      expect(bcryptAuth.hashPassword).toHaveBeenCalledWith('NewP@ss123');
      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        passwordHash: 'new-hash',
      });
      expect(queue.publish).toHaveBeenCalledWith(
        NOTIFICATION_STREAM,
        expect.objectContaining({
          type: NotificationType.PASSWORD_CHANGED,
        }),
      );
    });

    it('throws BadRequestException for invalid code', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      await service.forgotPassword('test@example.com');

      await expect(
        service.resetPassword('test@example.com', '000000', 'NewP@ss123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for expired code', async () => {
      jest.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
      userRepo.findByEmail.mockResolvedValue(mockUser);
      await service.forgotPassword('test@example.com');

      jest.setSystemTime(new Date('2026-01-01T00:16:00Z'));

      await expect(
        service.resetPassword('test@example.com', MOCK_CODE, 'NewP@ss123'),
      ).rejects.toThrow(BadRequestException);
      jest.useRealTimers();
    });

    it('throws BadRequestException when user not found after code validation', async () => {
      userRepo.findByEmail
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      await service.forgotPassword('test@example.com');

      await expect(
        service.resetPassword('test@example.com', MOCK_CODE, 'NewP@ss123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('normalizes email to lowercase', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      await service.forgotPassword('test@example.com');

      await expect(
        service.resetPassword('TEST@example.com', MOCK_CODE, 'NewP@ss123'),
      ).resolves.toBeDefined();

      expect(userRepo.findByEmail).toHaveBeenLastCalledWith('test@example.com');
    });
  });
});
