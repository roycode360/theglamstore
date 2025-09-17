import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<OrderModel>;

@Schema({ timestamps: true })
export class OrderModel {
  @Prop({ required: true }) email!: string;
  @Prop({ required: true }) firstName!: string;
  @Prop({ required: true }) lastName!: string;
  @Prop() phone?: string;
  @Prop({ required: true }) address1!: string;
  @Prop({ required: true }) city!: string;
  @Prop({ required: true }) state!: string;

  @Prop({ type: Number, required: true }) subtotal!: number;
  @Prop({ type: Number, required: true }) tax!: number;
  @Prop({ type: Number, required: true }) total!: number;

  @Prop({ type: String, enum: ['bank_transfer'], required: true })
  paymentMethod!: 'bank_transfer';

  @Prop({
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ],
    default: 'pending',
  })
  status!:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';

  @Prop({ type: String }) transferProofUrl?: string;

  @Prop({
    type: [
      {
        productId: { type: String, required: true },
        name: String,
        price: Number,
        quantity: Number,
        selectedSize: String,
        selectedColor: String,
        image: String,
      },
    ],
    default: [],
  })
  items!: Array<{
    productId: string;
    name?: string;
    price?: number;
    quantity?: number;
    selectedSize?: string;
    selectedColor?: string;
    image?: string;
  }>;

  // Internal flag to ensure we don't deduct stock more than once per order
  @Prop({ default: false }) stockAdjusted?: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(OrderModel);
