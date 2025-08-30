import { Request } from 'express';

export type AccountRole = 'admin' | 'customer';

export interface GqlContext extends Request {
  req: Request & { user?: { id: string; role: AccountRole } };
}

export interface JwtPayload {
  sub: string;
  role: AccountRole;
  iat?: number;
  exp?: number;
}

export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'admin';
  refreshTokenHash?: string | null;
};
