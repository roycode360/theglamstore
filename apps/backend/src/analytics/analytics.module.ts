import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsResolver } from './analytics.resolver.js';
import { AnalyticsService } from './analytics.service.js';
import {
  UserEventModel,
  UserEventSchema,
} from './schemas/user-event.schema.js';
import { UserModel, UserSchema } from '../users/schemas/user.schema.js';
import {
  OrderModel,
  OrderSchema,
} from '../orders/schemas/order.schema.js';
import {
  ProductModel,
  ProductSchema,
} from '../products/schemas/product.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEventModel.name, schema: UserEventSchema },
      { name: OrderModel.name, schema: OrderSchema },
      { name: ProductModel.name, schema: ProductSchema },
      { name: UserModel.name, schema: UserSchema },
    ]),
  ],
  providers: [AnalyticsResolver, AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

