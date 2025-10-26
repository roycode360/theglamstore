import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { LoginResponse } from './auth.types';
import { AuthUser, JwtPayload } from 'src/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  private async generateTokensForUser(user: AuthUser): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }

  async loginWithAuth0(auth0Token: string): Promise<LoginResponse> {
    const domain = process.env.AUTH0_DOMAIN;
    if (!domain) {
      throw new UnauthorizedException('Auth0 domain not configured');
    }

    // Validate token by calling Auth0 userinfo endpoint
    const resp = await fetch(`https://${domain}/userinfo`, {
      headers: { Authorization: `Bearer ${auth0Token}` },
    });
    if (!resp.ok) {
      throw new UnauthorizedException('Invalid Auth0 token');
    }

    const raw: unknown = await resp.json();
    let email: string | undefined;

    if (typeof raw === 'object' && raw !== null && 'email' in raw) {
      const v = (raw as Record<string, unknown>).email;
      if (typeof v === 'string') email = v;
    }

    if (!email) {
      throw new UnauthorizedException('Auth0 profile missing email');
    }

    // Find or create user
    let user = await this.users.findByEmail(email);
    if (!user) {
      const adminEmail1 = process.env.ADMIN_EMAIL_1;
      const adminEmail2 = process.env.ADMIN_EMAIL_2;
      const role: 'customer' | 'admin' =
        (adminEmail1 && adminEmail1.toLowerCase() === email.toLowerCase()) ||
        (adminEmail2 && adminEmail2.toLowerCase() === email.toLowerCase())
          ? 'admin'
          : 'customer';

      user = await this.users.createUser(email, role);
    }

    const { accessToken, refreshToken } = await this.generateTokensForUser({
      id: String(user._id),
      email: email,
      role: user.role,
    } as AuthUser);

    // Persist refresh token hash
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.users.setRefreshTokenHash(String(user._id), refreshHash);

    return {
      accessToken,
      refreshToken,
      user: {
        id: String(user._id),
        email: email,
        role: user.role,
      },
    };
  }
}
