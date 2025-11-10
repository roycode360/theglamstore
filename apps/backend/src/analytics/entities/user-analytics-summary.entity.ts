import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserAnalyticsSummary {
  @Field(() => Number)
  totalUsers!: number;

  @Field(() => Number)
  newSignupsThisMonth!: number;

  @Field(() => Number)
  activeUsersToday!: number;

  @Field(() => Number)
  returningUsersThisWeek!: number;
}

