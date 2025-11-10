import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type ReviewDocument = HydratedDocument<ReviewModel>;

@Schema({ timestamps: true })
export class ReviewModel {
  @Prop({ type: String, required: true })
  productId!: string;

  @Prop({ type: String, required: true })
  productName!: string;

  @Prop({ type: String })
  productSlug?: string | null;

  @Prop({ type: String })
  productImage?: string | null;

  @Prop({ type: String, required: true })
  orderId!: string;

  @Prop({ type: String })
  orderNumber?: string | null;

  @Prop({ type: String, required: true })
  customerId!: string;

  @Prop({ type: String, required: true })
  customerEmail!: string;

  @Prop({ type: String, required: true })
  customerName!: string;

  @Prop({ type: String })
  customerAvatarUrl?: string | null;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  rating!: number;

  @Prop({ type: String, required: true })
  message!: string;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status!: ReviewStatus;

  @Prop({ type: String, default: null })
  moderatedBy?: string | null;

  @Prop({ type: Date, default: null })
  moderatedAt?: Date | null;

  @Prop({ type: String, default: null })
  rejectionReason?: string | null;
}

export const ReviewSchema = SchemaFactory.createForClass(ReviewModel);

ReviewSchema.index({ productId: 1, customerId: 1 }, { unique: true });
ReviewSchema.index({ productId: 1, status: 1 });
ReviewSchema.index({ status: 1, createdAt: -1 });
