import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TopSellingProduct {
  @Field(() => ID)
  productId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  image?: string;

  @Field()
  slug!: string;

  @Field(() => Number)
  quantitySold!: number;

  @Field(() => Number)
  totalRevenue!: number;
}

@ObjectType()
export class TopSellingProducts {
  @Field(() => [TopSellingProduct])
  products!: TopSellingProduct[];
}
