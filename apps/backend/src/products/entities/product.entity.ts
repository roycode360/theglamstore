import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Product {
  @Field(() => ID)
  _id: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field({ nullable: true })
  brand?: string;

  @Field()
  category!: string;

  @Field(() => Number)
  price!: number;

  @Field(() => Number, { nullable: true })
  salePrice?: number | null;

  @Field(() => Number, { nullable: true })
  costPrice?: number | null;

  @Field({ nullable: true })
  sku?: string;

  @Field(() => Number, { nullable: true })
  stockQuantity?: number | null;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String])
  images!: string[];

  @Field(() => [String])
  sizes!: string[];

  @Field(() => [String])
  colors!: string[];

  @Field()
  featured!: boolean;

  @Field()
  active!: boolean;
}
