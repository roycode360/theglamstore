import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserAnalyticsEventInsight {
  @Field()
  eventType!: string;

  @Field(() => String, { nullable: true })
  page?: string | null;

  @Field(() => String, { nullable: true })
  productId?: string | null;

  @Field(() => String, { nullable: true })
  device?: string | null;

  @Field(() => String, { nullable: true })
  country?: string | null;

  @Field(() => String, { nullable: true })
  source?: string | null;

  @Field(() => String, { nullable: true })
  medium?: string | null;

  @Field(() => Number, { nullable: true })
  durationMs?: number | null;

  @Field(() => Date)
  createdAt!: Date;
}

