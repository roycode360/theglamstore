import { Field, Float, InputType, GraphQLISODateTime } from '@nestjs/graphql';
import { CouponDiscountType } from '../entities/coupon.entity';

@InputType()
export class CreateCouponInput {
  @Field()
  code!: string;

  @Field(() => CouponDiscountType)
  discountType!: CouponDiscountType;

  @Field(() => Float)
  discountValue!: number;

  @Field(() => Float, { nullable: true })
  minOrderAmount?: number;

  @Field(() => Float, { nullable: true })
  maxDiscount?: number;

  @Field({ nullable: true })
  usageLimit?: number;

  @Field(() => GraphQLISODateTime)
  expiresAt!: Date;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  createdBy?: string;
}
