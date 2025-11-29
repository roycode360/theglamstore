import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<OrderModel>;

@Schema({ timestamps: true })
export class OrderModel {
  @Prop({ required: true }) email!: string;
  @Prop({ required: true }) firstName!: string;
  @Prop({ required: true }) lastName!: string;
  @Prop({ required: true }) phone!: string;
  @Prop({ required: true }) address1!: string;
  @Prop({ required: true }) city!: string;
  @Prop({ required: true }) state!: string;

  @Prop({ type: String, unique: true, index: true })
  orderNumber?: string;

  @Prop({ type: Number, required: true }) subtotal!: number;
  @Prop({ type: Number, required: true }) total!: number;

  // Delivery fields
  @Prop({ type: Number, default: 0 })
  deliveryFee?: number;

  @Prop({ type: String })
  deliveryLocationId?: string | null;

  @Prop({ type: String })
  deliveryLocationName?: string | null;

  // Optional coupon fields
  @Prop() couponCode?: string;
  @Prop({ type: Number }) couponDiscount?: number;

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
      'awaiting_additional_payment',
    ],
    default: 'pending',
  })
  status!:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'awaiting_additional_payment';

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

  // Internal flag to ensure coupon usage increment happens once
  @Prop({ default: false }) couponUsageCounted?: boolean;

  // Payments and balances (bank transfer only, but we track amounts)
  @Prop({ type: Number, default: 0 }) amountPaid?: number;
  @Prop({ type: Number, default: 0 }) amountRefunded?: number;
  @Prop({ type: Number, default: 0 }) balanceDue?: number;

  @Prop({ type: String }) paymentReference?: string | null;

  @Prop({ type: String }) notes?: string | null;

  // Source of order
  @Prop({ type: String, enum: ['customer', 'admin'], default: 'customer' })
  source?: 'customer' | 'admin';

  // Simple audit log entries
  @Prop({
    type: [
      {
        at: { type: Date, default: Date.now },
        actorId: { type: String, default: null },
        actorRole: { type: String, default: null },
        type: { type: String, required: true },
        payload: { type: Object, default: null },
      },
    ],
    default: [],
  })
  auditLog?: Array<{
    at: Date;
    actorId?: string;
    actorRole?: string;
    type?: string;
    payload?: Record<string, any>;
  }>;
}

export const OrderSchema = SchemaFactory.createForClass(OrderModel);

OrderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });
