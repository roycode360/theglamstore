import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { GqlContext, JwtPayload } from 'src/types';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/constants';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (isPublic) return true;

    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext<GqlContext>();

    const token = this.extractTokenFromHeader(req as GqlContext);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      req.user = {
        id: String(payload.sub),
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Session expired, please login again.');
    }
  }

  private extractTokenFromHeader(request: GqlContext): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
