import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponsService } from './coupons.service';
import { CouponsResolver } from './coupons.resolver';
import { CouponModel, CouponSchema } from './schemas/coupon.schema';
import {
  UserCouponModel,
  UserCouponSchema,
} from './schemas/user-coupon.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CouponModel.name, schema: CouponSchema },
      { name: UserCouponModel.name, schema: UserCouponSchema },
    ]),
  ],
  providers: [CouponsService, CouponsResolver],
  controllers: [],
  exports: [CouponsService],
})
export class CouponsModule {}
