import { Request } from 'express';

export type AccountRole = 'admin' | 'customer';

export interface GqlContext extends Request {
  req: Request & { user?: { id: string; role: AccountRole; email: string } };
}

export interface JwtPayload {
  sub: string;
  role: AccountRole;
  email: string;
  iat?: number;
  exp?: number;
}

export type AuthUser = {
  id: string;
  email: string;
  role: 'customer' | 'admin';
};

export interface GqlContext {
  req: Request & { user?: AuthUser };
}
