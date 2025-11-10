import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserAnalyticsUser {
  @Field()
  userId!: string;

  @Field()
  fullName!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  country?: string | null;

  @Field(() => String, { nullable: true })
  region?: string | null;

  @Field(() => Date, { nullable: true })
  createdAt?: Date | null;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date | null;

  @Field(() => Date, { nullable: true })
  lastSeenAt?: Date | null;

  @Field(() => Number)
  totalOrders!: number;

  @Field(() => Number)
  totalSpend!: number;

  @Field(() => Number)
  averageOrderValue!: number;

  @Field(() => Number)
  totalSessions!: number;
}

@ObjectType()
export class UserAnalyticsUserPage {
  @Field(() => [UserAnalyticsUser])
  items!: UserAnalyticsUser[];

  @Field(() => Number)
  total!: number;

  @Field(() => Number)
  page!: number;

  @Field(() => Number)
  pageSize!: number;
}

