import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DeliveryLocationDocument = HydratedDocument<DeliveryLocationModel>;

@Schema({ timestamps: true })
export class DeliveryLocationModel {
  @Prop({ required: true, unique: true }) name!: string;
  @Prop({ required: true, type: Number }) price!: number;
  @Prop({ type: Boolean, default: true }) active!: boolean;
  @Prop({ type: Boolean, default: false }) isDefault!: boolean;
}

export const DeliveryLocationSchema =
  SchemaFactory.createForClass(DeliveryLocationModel);


