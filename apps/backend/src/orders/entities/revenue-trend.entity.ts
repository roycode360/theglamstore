import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RevenueTrendPoint {
  @Field()
  date!: string;

  @Field(() => Number)
  revenue!: number;
}

@ObjectType()
export class RevenueTrend {
  @Field(() => [RevenueTrendPoint])
  points!: RevenueTrendPoint[];
}
