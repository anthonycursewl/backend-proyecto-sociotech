export class RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}
