import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartService } from './cart.service';
import { CartResolver } from './cart.resolver';
import { CartItem, CartItemSchema } from './cart-item.schema';
import {
  ProductModel,
  ProductSchema,
} from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CartItem.name, schema: CartItemSchema },
      { name: ProductModel.name, schema: ProductSchema },
    ]),
  ],
  providers: [CartService, CartResolver],
  exports: [CartService],
})
export class CartModule {}
