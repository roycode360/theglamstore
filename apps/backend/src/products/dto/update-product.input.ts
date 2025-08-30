import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  brand?: string;

  @Field({ nullable: true })
  category?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  salePrice?: number | null;

  @Field({ nullable: true })
  sku?: string;

  @Field(() => Number, { nullable: true })
  stockQuantity?: number | null;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String], { nullable: true })
  images?: string[];

  @Field(() => [String], { nullable: true })
  sizes?: string[];

  @Field(() => [String], { nullable: true })
  colors?: string[];

  @Field({ nullable: true })
  featured?: boolean;

  @Field({ nullable: true })
  active?: boolean;
}
