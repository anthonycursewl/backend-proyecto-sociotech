import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AuthService, TokenPayload } from '../../domain/ports/auth-service.port';

@Injectable()
export class BcryptAuthService implements AuthService {
  private readonly jwtSecret: string;
  private readonly accessTokenExpiresIn = '15m';
  private readonly refreshTokenExpiresIn = '7d';

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateToken(payload: TokenPayload): Promise<string> {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiresIn,
      algorithm: 'HS256',
    });
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    return jwt.verify(token, this.jwtSecret, {
      algorithms: ['HS256'],
    }) as TokenPayload;
  }

  async generateRefreshToken(payload: TokenPayload): Promise<string> {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshTokenExpiresIn,
      algorithm: 'HS256',
    });
  }
}