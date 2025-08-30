import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

// --- Step 1: Define a decorator for roles ---
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Step 2: Get the required roles from metadata (@Roles('admin'))
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Step 3: Switch to GraphQL context
    const gqlContext = GqlExecutionContext.create(context);
    const req = gqlContext.getContext().req; // <- This is the same req object that JwtAuthGuard attaches user to

    // Step 4: Extract user role from request
    const user = req.user;
    const userRole = user?.role;

    // Step 5: Check if user’s role matches any of the required roles
    return !!userRole && requiredRoles.includes(userRole);
  }
}
