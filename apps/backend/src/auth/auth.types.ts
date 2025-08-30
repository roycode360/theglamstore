import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AuthUser {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field()
  role!: string;
}

@ObjectType()
export class RegisterResponse {
  @Field()
  pending!: boolean;

  @Field()
  userId!: string;
}

@ObjectType()
export class VerifyEmailResponse {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field(() => AuthUser)
  user!: AuthUser;
}

@ObjectType()
export class LoginResponse {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field(() => AuthUser)
  user!: AuthUser;
}

@ObjectType()
export class RefreshResponse {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field(() => AuthUser)
  user!: AuthUser;
}
