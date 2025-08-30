import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartService } from './cart.service';
import { CartResolver } from './cart.resolver';
import { CartItem, CartItemSchema } from './cart.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CartItem.name, schema: CartItemSchema },
    ]),
  ],
  providers: [CartService, CartResolver],
  exports: [CartService],
})
export class CartModule {}
