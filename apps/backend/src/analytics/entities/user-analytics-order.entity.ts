import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserAnalyticsOrderSummary {
  @Field()
  orderId!: string;

  @Field(() => String, { nullable: true })
  orderNumber?: string | null;

  @Field(() => String)
  status!: string;

  @Field(() => Number)
  total!: number;

  @Field(() => Date, { nullable: true })
  createdAt?: Date | null;
}

