import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginResponse } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { AccountRole, AuthUser } from 'src/types';
import { isPublic } from './decorators';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './gql-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @isPublic()
  @Mutation(() => LoginResponse)
  async loginWithAuth0(@Args('auth0Token') auth0Token: string) {
    return this.auth.loginWithAuth0(auth0Token);
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: AuthUser | null): Promise<User | null> {
    if (!user) return null;

    const existingUser = await this.users.findById(user.id);

    if (!existingUser) return null;

    return {
      _id: String(existingUser._id ?? ''),
      email: String(existingUser.email ?? ''),
      role: existingUser.role as AccountRole,
      emailVerified: Boolean(existingUser.emailVerified),
      createdAt: existingUser.createdAt,
      updatedAt: existingUser.updatedAt,
    };
  }
}
