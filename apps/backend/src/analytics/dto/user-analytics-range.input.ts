import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UserAnalyticsRangeInput {
  @Field(() => Date, { nullable: true })
  start?: Date;

  @Field(() => Date, { nullable: true })
  end?: Date;
}

@InputType()
export class UserAnalyticsTrendInput {
  @Field({ defaultValue: 'daily' })
  period?: 'daily' | 'weekly';

  @Field(() => Number, { nullable: true })
  days?: number | null;

  @Field(() => UserAnalyticsRangeInput, { nullable: true })
  range?: UserAnalyticsRangeInput | null;
}

@InputType()
export class ListAnalyticsUsersInput {
  @Field(() => Number, { nullable: true })
  page?: number | null;

  @Field(() => Number, { nullable: true })
  pageSize?: number | null;

  @Field(() => String, { nullable: true })
  search?: string | null;

  @Field(() => String, { nullable: true })
  country?: string | null;
}

@InputType()
export class RecordUserEventInput {
  @Field()
  eventType!: string;

  @Field({ nullable: true })
  sessionId?: string;

  @Field({ nullable: true })
  source?: string;

  @Field({ nullable: true })
  medium?: string;

  @Field({ nullable: true })
  campaign?: string;

  @Field({ nullable: true })
  page?: string;

  @Field({ nullable: true })
  productId?: string;

  @Field({ nullable: true })
  device?: string;

  @Field({ nullable: true })
  country?: string;

  @Field(() => Number, { nullable: true })
  durationMs?: number;
}

