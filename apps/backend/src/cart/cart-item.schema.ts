import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Field, ID, ObjectType } from '@nestjs/graphql';

export type CartItemDocument = CartItem & Document;

@ObjectType()
@Schema({ timestamps: true })
export class CartItem {
  @Field(() => ID)
  _id: string;

  @Field()
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Field()
  @Prop({ required: true, type: Types.ObjectId, ref: 'ProductModel' })
  productId: Types.ObjectId;

  @Field()
  @Prop({ required: true, min: 1 })
  quantity: number;

  @Field()
  @Prop({ required: false })
  selectedSize: string;

  @Field()
  @Prop({ required: false })
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
