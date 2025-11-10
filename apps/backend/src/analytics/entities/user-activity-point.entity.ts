import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserActivityPoint {
  @Field()
  date!: string;

  @Field(() => Number)
  activeUsers!: number;

  @Field(() => Number)
  sessions!: number;

  @Field(() => Number)
  newUsers!: number;
}

