import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<ProductModel>;

@Schema({ timestamps: true })
export class ProductModel {
  @Prop({ required: true }) name!: string;
  @Prop({ required: true, unique: true }) slug!: string;
  @Prop() brand?: string;
  @Prop({ required: true }) category!: string;
  @Prop({ required: true, type: Number }) price!: number;
  @Prop({ type: Number }) salePrice?: number | null;
  @Prop() sku?: string;
  @Prop({ type: Number }) stockQuantity?: number | null;
  @Prop() description?: string;
  @Prop({ type: [String], default: [] }) images!: string[];
  @Prop({ type: [String], default: [] }) sizes!: string[];
  @Prop({ type: [String], default: [] }) colors!: string[];
  @Prop({ default: false }) featured!: boolean;
  @Prop({ default: true }) active!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(ProductModel);
