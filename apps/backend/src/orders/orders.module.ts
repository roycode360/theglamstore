import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersResolver } from './orders.resolver.js';
import { OrdersService } from './orders.service.js';
import { OrderModel, OrderSchema } from './schemas/order.schema.js';
import { AuthModule } from '../auth/auth.module.js';
import {
  ProductModel,
  ProductSchema,
} from '../products/schemas/product.schema.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import {
  DeliveryLocationModel,
  DeliveryLocationSchema,
} from '../delivery-locations/schemas/delivery-location.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrderModel.name, schema: OrderSchema },
      { name: ProductModel.name, schema: ProductSchema },
      {
        name: DeliveryLocationModel.name,
        schema: DeliveryLocationSchema,
      },
    ]),
    AuthModule,
    CouponsModule,
  ],
  providers: [OrdersResolver, OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
