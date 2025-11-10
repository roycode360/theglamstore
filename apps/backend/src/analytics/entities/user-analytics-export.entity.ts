import { Field, ObjectType } from '@nestjs/graphql';
import { UserAnalyticsUser } from './user-analytics-user.entity.js';

@ObjectType()
export class UserAnalyticsExport {
  @Field(() => [UserAnalyticsUser])
  rows!: UserAnalyticsUser[];
}

