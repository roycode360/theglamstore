import { Types } from 'mongoose';
import { Field, ObjectType, ID, Int } from '@nestjs/graphql';
import { Product } from '../products/entities/product.entity';

@ObjectType()
export class CartItemType {
  @Field()
  _id: string;

  @Field(() => ID)
  userId: Types.ObjectId;

  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field(() => Int)
  quantity: number;

  @Field(() => String, { nullable: true })
  selectedSize?: string;

  @Field()
  selectedColor: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
