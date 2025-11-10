import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum ReviewStatusEnum {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

registerEnumType(ReviewStatusEnum, {
  name: 'ReviewStatus',
});

@ObjectType()
export class Review {
  @Field(() => ID)
  _id!: string;

  @Field()
  productId!: string;

  @Field()
  productName!: string;

  @Field(() => String, { nullable: true })
  productSlug?: string | null;

  @Field(() => String, { nullable: true })
  productImage?: string | null;

  @Field()
  orderId!: string;

  @Field(() => String, { nullable: true })
  orderNumber?: string | null;

  @Field()
  customerId!: string;

  @Field()
  customerEmail!: string;

  @Field()
  customerName!: string;

  @Field(() => String, { nullable: true })
  customerAvatarUrl?: string | null;

  @Field(() => Number)
  rating!: number;

  @Field()
  message!: string;

  @Field(() => ReviewStatusEnum)
  status!: ReviewStatusEnum;

  @Field(() => String, { nullable: true })
  moderatedBy?: string | null;

  @Field(() => Date, { nullable: true })
  moderatedAt?: Date | null;

  @Field(() => String, { nullable: true })
  rejectionReason?: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType()
export class ReviewEligibility {
  @Field()
  hasPurchased!: boolean;

  @Field()
  canReview!: boolean;

  @Field(() => Review, { nullable: true })
  existingReview?: Review | null;
}
