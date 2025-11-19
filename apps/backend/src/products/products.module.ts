import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './products.service';
import { ProductModel, ProductSchema } from './schemas/product.schema';
import { AuthModule } from 'src/auth/auth.module';
import {
  CategoryModel,
  CategorySchema,
} from '../categories/schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductModel.name, schema: ProductSchema },
      { name: CategoryModel.name, schema: CategorySchema },
    ]),
    AuthModule,
  ],
  providers: [ProductsResolver, ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {
  constructor(private readonly service: ProductsService) {}
}
