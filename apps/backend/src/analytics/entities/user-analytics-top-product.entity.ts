import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserAnalyticsTopProduct {
  @Field()
  productId!: string;

  @Field()
  name!: string;

  @Field(() => Number)
  views!: number;

  @Field(() => Number)
  clicks!: number;

  @Field(() => Number)
  purchases!: number;
}

