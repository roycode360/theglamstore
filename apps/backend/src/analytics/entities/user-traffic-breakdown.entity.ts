import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserAnalyticsKeyValue {
  @Field()
  label!: string;

  @Field(() => Number)
  value!: number;
}

@ObjectType()
export class UserTrafficBreakdown {
  @Field(() => [UserAnalyticsKeyValue])
  countries!: UserAnalyticsKeyValue[];

  @Field(() => [UserAnalyticsKeyValue])
  sources!: UserAnalyticsKeyValue[];

  @Field(() => [UserAnalyticsKeyValue])
  devices!: UserAnalyticsKeyValue[];
}

