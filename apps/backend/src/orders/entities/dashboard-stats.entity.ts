import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Order } from './order.entity';

@ObjectType()
export class DashboardTopSellingProduct {
  @Field()
  productId!: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  image?: string;

  @Field(() => Int)
  units!: number;

  @Field(() => Float)
  revenue!: number;
}

@ObjectType()
export class SalesPerDay {
  @Field(() => Int)
  day!: number;

  @Field(() => Float)
  revenue!: number;
}

@ObjectType()
export class DashboardStats {
  @Field(() => Float)
  totalRevenue!: number;

  @Field(() => Int)
  totalOrders!: number;

  @Field(() => Int)
  totalProducts!: number;

  @Field(() => Int)
  lowStockItems!: number;

  @Field(() => [Order])
  recentOrders!: Order[];

  @Field(() => [SalesPerDay])
  salesPerDay!: SalesPerDay[];

  @Field(() => [DashboardTopSellingProduct])
  topSellingProducts!: DashboardTopSellingProduct[];
}

