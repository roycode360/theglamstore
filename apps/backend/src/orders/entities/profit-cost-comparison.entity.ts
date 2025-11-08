import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProfitCostPoint {
  @Field()
  date!: string;

  @Field(() => Number)
  profit!: number;

  @Field(() => Number)
  cost!: number;
}

@ObjectType()
export class ProfitCostComparison {
  @Field(() => [ProfitCostPoint])
  points!: ProfitCostPoint[];
}

