import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginResponse } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { GqlAuthGuard } from './gql-auth.guard';
import { AccountRole } from 'src/types';
import { isPublic } from './decorators';

type MeUser = {
  id: string;
  email: string;
  role: 'customer' | 'admin';
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

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

  @Query(() => User, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: { id: string } | null): Promise<MeUser | null> {
    if (!user) return null;
    const found = await this.users.findById(user.id);
    if (!found) return null;
    const role: AccountRole = found.role;
    return {
      id: String(found._id ?? ''),
      email: String(found.email ?? ''),
      role,
      emailVerified: Boolean(found.emailVerified),
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    };
  }
}
