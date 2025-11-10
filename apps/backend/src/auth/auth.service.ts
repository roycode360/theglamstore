import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { LoginResponse } from './auth.types';
import { AuthUser, JwtPayload } from 'src/types';
import { Auth0UserResponse } from './dto/auth0-user.dto';

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
    try {
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

      const raw = (await resp.json()) as unknown;

      const namespace = process.env.AUTH0_NAMESPACE;
      const auth0User = raw as Auth0UserResponse;
      const email = auth0User.email;
      const fullName = `${auth0User.given_name} ${auth0User.family_name}`;
      const emailVerified = auth0User.email_verified;
      const picture = auth0User.picture;
      const roleField = `${namespace}roles` as keyof typeof auth0User;
      const role = (auth0User[roleField] as string[])[0] as
        | 'customer'
        | 'admin';

      if (!email) {
        throw new UnauthorizedException('Auth0 profile missing email');
      }

      // Find or create user (idempotent)
      let user = await this.users.findByEmail(email);
      if (!user) {
        try {
          user = await this.users.createUser(
            email,
            role,
            emailVerified,
            fullName,
            picture,
          );
        } catch (err: unknown) {
          // Handle potential race (duplicate insert) gracefully
          const code = (err as { code?: number })?.code;
          if (code === 11000) {
            user = await this.users.findByEmail(email);
          } else {
            throw err as Error;
          }
        }
      }

      if (!user) {
        // As a final fallback, attempt to fetch again, otherwise abort
        user = await this.users.findByEmail(email);
        if (!user) {
          throw new UnauthorizedException(
            'Unable to create or load user profile',
          );
        }
      }

      // update user role if it's not the same as the role in the database
      if (user.role !== role) {
        await this.users.setRole(String(user._id), role);
      }

      const { accessToken, refreshToken } = await this.generateTokensForUser({
        id: String(user._id),
        email: email,
        role: role ?? user.role,
      } as AuthUser);

      // Persist refresh token hash
      const refreshHash = await bcrypt.hash(refreshToken, 10);
      await this.users.setRefreshTokenHash(String(user._id), refreshHash);
      await this.users.recordLogin(String(user._id), {
        country: auth0User?.['https://theglamstore.ng/location'] as
          | string
          | undefined,
      });

      return {
        accessToken,
        refreshToken,
        user: {
          _id: String(user._id),
          fullName: user.fullName,
          email: email,
          avatar: user.avatar ?? undefined,
          role: role ?? user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error: unknown) {
      console.error(error);
      // Normalize errors to Unauthorized to avoid leaking internals
      throw new UnauthorizedException(
        'Authentication failed',
        (error as Error).message,
      );
    }
  }
}
