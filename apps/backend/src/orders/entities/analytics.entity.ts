import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Analytics {
  @Field(() => Float)
  totalRevenue!: number;

  @Field(() => Float)
  totalProfit!: number;

  @Field(() => Float)
  totalCostPrice!: number;

  @Field(() => Float)
  totalSellingPrice!: number;

  @Field(() => Float)
  inventoryValue!: number;

  @Field(() => Number)
  numberOfCustomers!: number;

  @Field(() => Number)
  numberOfReturningCustomers!: number;

  @Field(() => Number)
  numberOfCompletedOrders!: number;

  @Field(() => Number)
  totalProductsSold!: number;
}
