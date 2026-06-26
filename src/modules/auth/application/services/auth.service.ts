import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import type { UserRepository } from '../../domain/repositories/user-repository.port';
import { USER_REPOSITORY } from '../../domain/repositories/user-repository.port';
import { User } from '@user/domain/entities/user.entity';
import { BcryptAuthService } from '../../infrastructure/strategies/bcrypt-auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/db/prisma.service';
import { RedisEventBus, DomainEvent } from '../../infrastructure/events';
import { QUEUE_SERVICE } from '../../../queue/queue.port';
import type { IQueueService } from '../../../queue/queue.port';
import {
  NOTIFICATION_STREAM,
  NotificationType,
  OTP_EXPIRES_MINUTES,
  OTP_CODE_LENGTH,
} from '../../../notifications/domain/notification.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ACCESS_TOKEN_EXPIRES_IN: string;
  private readonly REFRESH_TOKEN_EXPIRES_IN: string;
  private readonly REFRESH_TOKEN_DAYS: number;
  private readonly resetCodes = new Map<
    string,
    { code: string; expiresAt: Date }
  >();
  private readonly RESET_CODE_EXPIRES_MINUTES = 15;

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly bcryptAuth: BcryptAuthService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly eventBus: RedisEventBus,
    @Inject(QUEUE_SERVICE) private readonly queue: IQueueService,
    configService: ConfigService,
  ) {
    this.ACCESS_TOKEN_EXPIRES_IN =
      configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '2h';
    this.REFRESH_TOKEN_EXPIRES_IN =
      configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d';
    this.REFRESH_TOKEN_DAYS =
      configService.get<number>('JWT_REFRESH_DAYS') || 30;
  }

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedFirstName = dto.firstName.trim();
    const normalizedLastName = dto.lastName.trim();

    const existing = await this.userRepo.findByEmail(normalizedEmail);
    if (existing) {
      throw new UnauthorizedException('El correo ya existe');
    }

    const verified = await this.prisma.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        verified: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verified) {
      throw new BadRequestException(
        'Debes verificar tu correo electrónico antes de registrarte. ' +
          'Usa el endpoint POST /auth/send-verification-code para recibir un código.',
      );
    }

    const passwordHash = await this.bcryptAuth.hashPassword(dto.password);

    const defaultRole = await this.userRepo.findDefaultRoleId();
    if (!defaultRole) {
      throw new Error(
        'No se encontró un rol por defecto. Asegúrate de que exista un rol con isDefault=true en la base de datos.',
      );
    }

    const user = new User({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      roleId: defaultRole,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.userRepo.save(user);

    const userWithRole = await this.userRepo.findByIdWithRole(saved.id);

    const event: DomainEvent = {
      streamName: 'user:events',
      eventType: 'USER_REGISTERED',
      payload: {
        id: saved.id,
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        roleId: saved.roleId,
      },
      timestamp: new Date(),
    };

    this.logger.log(
      `[PUBLISH] Publishing USER_REGISTERED event for ${saved.id}`,
    );
    await this.eventBus.publish(event);
    this.logger.log(`[PUBLISH] Event published successfully for ${saved.id}`);

    this.queue
      .publish(NOTIFICATION_STREAM, {
        type: NotificationType.USER_REGISTERED,
        data: JSON.stringify({
          userId: saved.id,
        }),
      })
      .then((msgId) => {
        if (msgId) {
          this.logger.log(
            `[QUEUE] ${NotificationType.USER_REGISTERED} published as ${msgId} for user ${saved.id}`,
          );
        } else {
          this.logger.warn(
            `[QUEUE] ${NotificationType.USER_REGISTERED} returned no message ID for user ${saved.id} — email may not be sent`,
          );
        }
      })
      .catch((err: Error) =>
        this.logger.error(
          `[QUEUE] ${NotificationType.USER_REGISTERED} publish failed for user ${saved.id}: ${err.message}`,
        ),
      );

    return this.generateTokens(userWithRole || saved);
  }

  async login(dto: { email: string; password: string }) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await this.bcryptAuth.comparePassword(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.queue
      .publish(NOTIFICATION_STREAM, {
        type: NotificationType.LOGIN_DETECTED,
        data: JSON.stringify({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          time: new Date().toLocaleString('es-DO', {
            timeZone: 'America/Santo_Domingo',
          }),
        }),
      })
      .then((msgId) => {
        if (!msgId) {
          this.logger.warn(
            `[QUEUE] ${NotificationType.LOGIN_DETECTED} not queued for ${user.email} — queue unavailable`,
          );
        }
      })
      .catch((err: Error) =>
        this.logger.error(
          `[QUEUE] ${NotificationType.LOGIN_DETECTED} publish failed for ${user.email}: ${err.message}`,
        ),
      );

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const user = await this.userRepo.findByIdWithRole(payload.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      if (!user.refreshToken) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      const isRefreshTokenValid = await this.bcryptAuth.comparePassword(
        refreshToken,
        user.refreshToken,
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      if (user.refreshTokenExpires && new Date() > user.refreshTokenExpires) {
        throw new UnauthorizedException('Refresh token expirado');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findByIdWithRole(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: user.roleName,
        permissions: user.permissions,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async sendVerificationCode(email: string): Promise<{ message: string }> {
    if (!email || typeof email !== 'string') {
      this.logger.warn(
        `sendVerificationCode called with invalid email: ${JSON.stringify(email)}`,
      );
      throw new BadRequestException('El correo electrónico es requerido');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.userRepo.findByEmail(normalizedEmail);
    if (existing) {
      throw new BadRequestException('Este correo ya está registrado');
    }

    const code = randomInt(0, 10 ** OTP_CODE_LENGTH)
      .toString()
      .padStart(OTP_CODE_LENGTH, '0');

    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    await this.prisma.emailVerification.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt,
      },
    });

    this.queue
      .publish(NOTIFICATION_STREAM, {
        type: NotificationType.EMAIL_VERIFICATION,
        data: JSON.stringify({
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0],
          code,
          expiresInMinutes: OTP_EXPIRES_MINUTES,
        }),
      })
      .then((msgId) => {
        if (msgId) {
          this.logger.log(
            `[QUEUE] ${NotificationType.EMAIL_VERIFICATION} queued for ${normalizedEmail}`,
          );
        } else {
          this.logger.warn(
            `[QUEUE] ${NotificationType.EMAIL_VERIFICATION} not queued for ${normalizedEmail} — queue unavailable`,
          );
        }
      })
      .catch((err: Error) =>
        this.logger.error(
          `[QUEUE] ${NotificationType.EMAIL_VERIFICATION} publish failed for ${normalizedEmail}: ${err.message}`,
        ),
      );

    this.logger.log(`Verification code generated for ${normalizedEmail}`);
    return { message: 'Código de verificación enviado al correo' };
  }

  async verifyCode(email: string, code: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        email: normalizedEmail,
        code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new BadRequestException('Código inválido o expirado');
    }

    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    this.logger.log(`Email ${normalizedEmail} verified successfully`);
    return { message: 'Correo verificado exitosamente' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    if (!email || typeof email !== 'string') {
      this.logger.warn(
        `forgotPassword called with invalid email: ${JSON.stringify(email)}`,
      );
      throw new BadRequestException('El correo electrónico es requerido');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      this.logger.warn(
        `[forgotPassword] No user found for email "${normalizedEmail}" — no code will be sent. ` +
          `This may indicate the account was deleted or the email is incorrect.`,
      );
      return {
        message:
          'Si el correo existe, recibirás un código para restablecer tu contraseña',
      };
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    const expiresAt = new Date(
      Date.now() + this.RESET_CODE_EXPIRES_MINUTES * 60 * 1000,
    );
    this.resetCodes.set(normalizedEmail, { code, expiresAt });

    this.queue
      .publish(NOTIFICATION_STREAM, {
        type: NotificationType.PASSWORD_RESET,
        data: JSON.stringify({
          email: normalizedEmail,
          name: `${user.firstName} ${user.lastName}`,
          code,
          expiresInMinutes: this.RESET_CODE_EXPIRES_MINUTES,
        }),
      })
      .then((msgId) => {
        if (msgId) {
          this.logger.log(
            `[QUEUE] ${NotificationType.PASSWORD_RESET} queued for ${normalizedEmail}`,
          );
        } else {
          this.logger.warn(
            `[QUEUE] ${NotificationType.PASSWORD_RESET} not queued for ${normalizedEmail} — queue unavailable`,
          );
        }
      })
      .catch((err: Error) =>
        this.logger.error(
          `[QUEUE] ${NotificationType.PASSWORD_RESET} publish failed for ${normalizedEmail}: ${err.message}`,
        ),
      );

    this.logger.log(`Password reset code generated for ${normalizedEmail}`);
    return {
      message:
        'Si el correo existe, recibirás un código para restablecer tu contraseña',
    };
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    const stored = this.resetCodes.get(normalizedEmail);
    if (!stored || stored.code !== code || stored.expiresAt < new Date()) {
      throw new BadRequestException('Código inválido o expirado');
    }

    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const passwordHash = await this.bcryptAuth.hashPassword(newPassword);
    await this.userRepo.update(user.id, { passwordHash });

    this.resetCodes.delete(normalizedEmail);

    this.queue
      .publish(NOTIFICATION_STREAM, {
        type: NotificationType.PASSWORD_CHANGED,
        data: JSON.stringify({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          time: new Date().toLocaleString('es-DO', {
            timeZone: 'America/Santo_Domingo',
          }),
        }),
      })
      .then((msgId) => {
        if (!msgId) {
          this.logger.warn(
            `[QUEUE] ${NotificationType.PASSWORD_CHANGED} not queued for ${user.email} — queue unavailable`,
          );
        }
      })
      .catch((err: Error) =>
        this.logger.error(
          `[QUEUE] ${NotificationType.PASSWORD_CHANGED} publish failed for ${user.email}: ${err.message}`,
        ),
      );

    this.logger.log(`Password reset successful for ${normalizedEmail}`);
    return { message: 'Contraseña restablecida exitosamente' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId, true);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isPasswordValid = await this.bcryptAuth.comparePassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const passwordHash = await this.bcryptAuth.hashPassword(newPassword);
    await this.userRepo.update(userId, { passwordHash });

    this.queue
      .publish(NOTIFICATION_STREAM, {
        type: NotificationType.PASSWORD_CHANGED,
        data: JSON.stringify({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          time: new Date().toLocaleString('es-DO', {
            timeZone: 'America/Santo_Domingo',
          }),
        }),
      })
      .then((msgId) => {
        if (!msgId) {
          this.logger.warn(
            `[QUEUE] ${NotificationType.PASSWORD_CHANGED} not queued for ${user.email} — queue unavailable`,
          );
        }
      })
      .catch((err: Error) =>
        this.logger.error(
          `[QUEUE] ${NotificationType.PASSWORD_CHANGED} publish failed for ${user.email}: ${err.message}`,
        ),
      );

    return { message: 'Contraseña cambiada exitosamente' };
  }

  async updateMyProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; email?: string },
  ): Promise<{
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      roleId: string;
      roleName: string;
      permissions: string[];
    };
  }> {
    const user = await this.userRepo.findByIdWithRole(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updateData: Record<string, any> = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;

    if (data.email) {
      const normalizedEmail = data.email.trim().toLowerCase();
      const existing = await this.userRepo.findByEmail(normalizedEmail);
      if (existing && existing.id !== userId) {
        throw new BadRequestException('El correo ya está en uso');
      }
      updateData.email = normalizedEmail;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    this.logger.log(
      `[UPDATE PROFILE] Updating user ${userId}: ${JSON.stringify(updateData)}`,
    );

    const updated = await this.userRepo.update(userId, updateData);

    return {
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        roleId: updated.roleId,
        roleName: updated.roleName,
        permissions: updated.permissions,
      },
    };
  }

  private async generateTokens(user: User) {
    const payload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
      permissions: user.permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN as any,
    });

    const hashedRefreshToken = await this.bcryptAuth.hashPassword(refreshToken);
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(
      refreshTokenExpires.getDate() + this.REFRESH_TOKEN_DAYS,
    );

    await this.userRepo.updateRefreshToken(
      user.id,
      hashedRefreshToken,
      refreshTokenExpires,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: user.roleName,
        permissions: user.permissions,
      },
    };
  }
}
