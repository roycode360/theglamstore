import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<CategoryModel>;

@Schema({ timestamps: true })
export class CategoryModel {
  @Prop({ required: true }) name!: string;
  @Prop({ required: true, unique: true }) slug!: string;
  @Prop() description?: string;
  @Prop() image?: string;
  @Prop({ type: Number, default: 0 }) sortOrder!: number;
  @Prop() parentId?: string;
  @Prop({ type: Boolean, default: true }) active!: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(CategoryModel);
