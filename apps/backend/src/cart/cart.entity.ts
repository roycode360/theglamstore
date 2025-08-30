import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Field, ObjectType, ID, Int } from '@nestjs/graphql';

export type CartItemDocument = CartItem & Document;

@ObjectType()
@Schema({ timestamps: true })
export class CartItem {
  @Field(() => ID)
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Field(() => ID)
  @Prop({ required: true, type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Field(() => Int)
  @Prop({ required: true, min: 1 })
  quantity: number;

  @Field()
  @Prop({ required: true })
  selectedSize: string;

  @Field()
  @Prop({ required: true })
  selectedColor: string;

  @Field()
  @Prop({ default: Date.now })
  createdAt: Date;

  @Field()
  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

// Create compound index for userId + productId + selectedSize + selectedColor
CartItemSchema.index(
  { userId: 1, productId: 1, selectedSize: 1, selectedColor: 1 },
  { unique: true },
);
