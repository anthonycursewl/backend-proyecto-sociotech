import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user-repository.port';
import { USER_REPOSITORY } from '../../domain/repositories/user-repository.port';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'i_like_donuts',
    });
  }

  async validate(payload: any) {
    const user = await this.userRepo.findById(payload.userId);
    if (!user || !user.isActive) {
      return null;
    }
    return { userId: user.id, email: user.email, role: user.role };
  }
}
