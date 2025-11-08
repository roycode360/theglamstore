import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CouponDocument = HydratedDocument<CouponModel>;

export type DiscountType = 'percentage' | 'fixed';

@Schema({ timestamps: true })
export class CouponModel {
  @Prop({ required: true, unique: true, index: true }) code!: string;

  @Prop({ required: true, enum: ['percentage', 'fixed'] })
  discountType!: DiscountType;

  @Prop({ type: Number, required: true }) discountValue!: number;

  @Prop({ type: Number }) minOrderAmount?: number;

  @Prop({ type: Number }) maxDiscount?: number;

  @Prop({ type: Number }) usageLimit?: number;

  @Prop({ type: Number, default: 0 }) usedCount!: number;

  @Prop({ type: Date, required: true }) expiresAt!: Date;

  @Prop({ type: Boolean, default: true }) isActive!: boolean;

  @Prop() createdBy?: string;
}

export const CouponSchema = SchemaFactory.createForClass(CouponModel);

CouponSchema.index({ code: 1 }, { unique: true });

// Normalize code as uppercase without surrounding whitespace
CouponSchema.pre('save', function (next) {
  const self = this as unknown as { code?: string };
  if (self.code) self.code = self.code.trim().toUpperCase();
  next();
});
