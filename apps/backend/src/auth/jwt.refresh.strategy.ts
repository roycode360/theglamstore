import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';

type RequestWithCookies = Omit<Request, 'cookies'> & {
  cookies?: Record<string, string | undefined>;
};

function cookieExtractor(req: RequestWithCookies): string | null {
  const token = req.cookies?.refresh_token;
  return token ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'secret',
      passReqToCallback: true,
    });
  }

  validate(
    req: RequestWithCookies,
    payload: Record<string, unknown>,
  ): Record<string, unknown> & { refreshToken: string | null } {
    return { ...payload, refreshToken: req.cookies?.refresh_token ?? null };
  }
}
