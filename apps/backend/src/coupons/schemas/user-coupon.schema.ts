import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserCouponDocument = HydratedDocument<UserCouponModel>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class UserCouponModel {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true, index: true }) code!: string;
}

export const UserCouponSchema = SchemaFactory.createForClass(UserCouponModel);
UserCouponSchema.index({ userId: 1, code: 1 }, { unique: true });
