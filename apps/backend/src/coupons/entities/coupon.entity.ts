import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  GraphQLISODateTime,
  registerEnumType,
} from '@nestjs/graphql';

export enum CouponDiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

registerEnumType(CouponDiscountType, { name: 'CouponDiscountType' });

@ObjectType()
export class Coupon {
  @Field(() => ID)
  _id!: string;

  @Field()
  code!: string;

  @Field(() => CouponDiscountType)
  discountType!: CouponDiscountType;

  @Field(() => Float)
  discountValue!: number;

  @Field(() => Float, { nullable: true })
  minOrderAmount?: number | null;

  @Field(() => Float, { nullable: true })
  maxDiscount?: number | null;

  @Field(() => Int, { nullable: true })
  usageLimit?: number | null;

  @Field()
  isActive!: boolean;

  @Field(() => Number)
  usedCount!: number;

  @Field(() => GraphQLISODateTime)
  expiresAt!: Date;

  @Field({ nullable: true })
  createdBy?: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

@ObjectType()
export class CouponValidationResult {
  @Field()
  valid!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => Float, { nullable: true })
  discountAmount?: number | null;

  @Field(() => Float, { nullable: true })
  newTotal?: number | null;

  @Field({ nullable: true })
  code?: string;
}
