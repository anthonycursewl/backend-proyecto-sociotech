import {
  Controller,
  Post,
  Put,
  Body,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../../application/services/auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  SendVerificationCodeDto,
  VerifyCodeDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-verification-code')
  async sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
    return this.authService.sendVerificationCode(dto.email);
  }

  @Post('verify-code')
  async verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.email, dto.code);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.password);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @Put('password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req) {
    return this.authService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
