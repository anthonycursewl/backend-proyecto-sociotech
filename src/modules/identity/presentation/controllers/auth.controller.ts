import { Injectable, Inject, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { User } from '@identity/domain/entities/user.entity';
import { LoginUseCase, RefreshTokenUseCase, LoginOutput } from '../../application/services';
import { RegisterUserDto, LoginDto, RefreshTokenDto } from './auth.dto';
import { ProfileResponseDto } from './profile.dto';
import { ProfileService } from './profile.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly profileService: ProfileService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<LoginOutput> {
    try {
      return await this.loginUseCase.execute({
        email: dto.email,
        password: dto.password,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    try {
      return await this.refreshTokenUseCase.execute({
        refreshToken: dto.refreshToken,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Post('register')
  async register(@Body() dto: RegisterUserDto): Promise<{ message: string }> {
    throw new BadRequestException('Registration disabled. Contact administrator.');
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: Request): Promise<ProfileResponseDto> {
    const user = req.user as User;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.profileService.getProfile(user);
  }
}