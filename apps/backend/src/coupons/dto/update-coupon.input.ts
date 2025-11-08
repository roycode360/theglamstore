import {
  Field,
  Float,
  GraphQLISODateTime,
  InputType,
  Int,
} from '@nestjs/graphql';
import { CouponDiscountType } from '../entities/coupon.entity';

@InputType()
export class UpdateCouponInput {
  @Field({ nullable: true })
  code?: string;

  @Field(() => CouponDiscountType, { nullable: true })
  discountType?: CouponDiscountType;

  @Field(() => Float, { nullable: true })
  discountValue?: number;

  @Field(() => Float, { nullable: true })
  minOrderAmount?: number;

  @Field(() => Float, { nullable: true })
  maxDiscount?: number;

  @Field(() => Int, { nullable: true })
  usageLimit?: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  expiresAt?: Date;

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  createdBy?: string;
}
