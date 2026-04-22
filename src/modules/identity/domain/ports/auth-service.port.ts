export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

export interface AuthService {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  generateToken(payload: TokenPayload): Promise<string>;
  verifyToken(token: string): Promise<TokenPayload>;
  generateRefreshToken(payload: TokenPayload): Promise<string>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}