import { Field, ObjectType } from '@nestjs/graphql';
import { UserAnalyticsUser } from './user-analytics-user.entity.js';
import { UserAnalyticsOrderSummary } from './user-analytics-order.entity.js';
import { UserAnalyticsEventInsight } from './user-analytics-event.entity.js';

@ObjectType()
export class UserAnalyticsDetail extends UserAnalyticsUser {
  @Field(() => Number)
  lifetimeSpend!: number;

  @Field(() => Number)
  lifetimeOrders!: number;

  @Field(() => [UserAnalyticsOrderSummary])
  recentOrders!: UserAnalyticsOrderSummary[];

  @Field(() => [UserAnalyticsEventInsight])
  recentEvents!: UserAnalyticsEventInsight[];
}

