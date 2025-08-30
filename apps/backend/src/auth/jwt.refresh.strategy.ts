import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

function cookieExtractor(req: any) {
  const token = req?.cookies?.refresh_token;
  return token || null;
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

  async validate(req: any, payload: any) {
    return { ...payload, refreshToken: req?.cookies?.refresh_token };
  }
}
