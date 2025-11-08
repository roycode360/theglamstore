import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class CreateProductInput {
  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field({ nullable: true })
  brand?: string;

  @Field()
  category!: string;

  @Field(() => Float)
  price!: number;

  @Field(() => Float, { nullable: true })
  salePrice?: number | null;

  @Field(() => Float, { nullable: true })
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
