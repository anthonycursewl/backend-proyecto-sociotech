import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { AuthService, TokenPayload } from '@identity/domain/ports/auth-service.port';

interface KeyPair {
  privateKey: string;
  publicKey: string;
}

@Injectable()
export class RS256AuthService implements AuthService {
  private readonly accessTokenExpiresIn = '15m';
  private readonly refreshTokenExpiresIn = '7d';
  private keyPair: KeyPair | null = null;

  private getKeyPair(): KeyPair {
    if (!this.keyPair) {
      const privateKey = process.env.JWT_PRIVATE_KEY;
      const publicKey = process.env.JWT_PUBLIC_KEY;

      if (!privateKey || !publicKey) {
        throw new Error('RSA keys not configured. Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables.');
      }

      this.keyPair = { privateKey, publicKey };
    }
    return this.keyPair;
  }

  static generateKeyPair(): KeyPair {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { privateKey, publicKey };
  }

  async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hash);
  }

  async generateToken(payload: TokenPayload): Promise<string> {
    const { privateKey } = this.getKeyPair();
    return jwt.sign(payload, privateKey, {
      expiresIn: this.accessTokenExpiresIn,
      algorithm: 'RS256',
    });
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    const { publicKey } = this.getKeyPair();
    return jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    }) as TokenPayload;
  }

  async generateRefreshToken(payload: TokenPayload): Promise<string> {
    const { privateKey } = this.getKeyPair();
    return jwt.sign(payload, privateKey, {
      expiresIn: this.refreshTokenExpiresIn,
      algorithm: 'RS256',
    });
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    const { publicKey } = this.getKeyPair();
    return jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    }) as TokenPayload;
  }
}