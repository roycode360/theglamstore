import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewsResolver } from './reviews.resolver.js';
import { ReviewsService } from './reviews.service.js';
import { ReviewModel, ReviewSchema } from './schemas/review.schema.js';
import {
  ProductModel,
  ProductSchema,
} from '../products/schemas/product.schema.js';
import { OrdersModule } from '../orders/orders.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReviewModel.name, schema: ReviewSchema },
      { name: ProductModel.name, schema: ProductSchema },
    ]),
    OrdersModule,
    AuthModule,
  ],
  providers: [ReviewsResolver, ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
