import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserFunnelStep {
  @Field()
  key!: string;

  @Field()
  label!: string;

  @Field(() => Number)
  count!: number;
}

