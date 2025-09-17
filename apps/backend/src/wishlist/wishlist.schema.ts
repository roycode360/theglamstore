import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type WishlistItemDocument = WishlistItem & Document;

@Schema({ timestamps: true })
export class WishlistItem {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductModel', required: true })
  productId!: Types.ObjectId;

  @Prop({ type: String })
  selectedSize?: string;

  @Prop({ type: String })
  selectedColor?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);
WishlistItemSchema.index(
  { userId: 1, productId: 1, selectedSize: 1, selectedColor: 1 },
  { unique: true },
);
