import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Auth0UserResponse {
  [key: string]: any;

  @Field()
  given_name: string;

  @Field()
  family_name: string;

  @Field()
  nickname: string;

  @Field()
  picture: string;

  @Field()
  updated_at: string;

  @Field()
  email: string;

  @Field()
  email_verified: boolean;
}
