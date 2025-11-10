import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserPageMetricPoint {
  @Field()
  date!: string;

  @Field(() => Number)
  pageViews!: number;

  @Field(() => Number)
  sessions!: number;

  @Field(() => Number)
  averageSessionDuration!: number;
}

