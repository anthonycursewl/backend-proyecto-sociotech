import { Inject, Injectable } from '@nestjs/common';
import type { AuthService, TokenPayload } from '@identity/domain/ports/auth-service.port';
import { AUTH_SERVICE } from '@identity/domain/ports/auth-service.port';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: AuthService,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const payload = await this.authService.verifyRefreshToken(input.refreshToken);

    const accessToken = await this.authService.generateToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    const refreshToken = await this.authService.generateRefreshToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}