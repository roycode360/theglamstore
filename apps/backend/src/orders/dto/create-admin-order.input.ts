import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AdminOrderItemInput {
  @Field(() => ID)
  productId!: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Int, { nullable: true })
  quantity?: number;

  @Field({ nullable: true })
  selectedSize?: string;

  @Field({ nullable: true })
  selectedColor?: string;

  @Field({ nullable: true })
  image?: string;
}

@InputType()
export class CreateAdminOrderInput {
  @Field() email!: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field({ nullable: true }) phone?: string;
  @Field() address1!: string;
  @Field() city!: string;
  @Field() state!: string;

  @Field(() => [AdminOrderItemInput])
  items!: AdminOrderItemInput[];

  @Field({ nullable: true })
  couponCode?: string;

  @Field(() => Float, { nullable: true })
  couponDiscount?: number;

  @Field(() => Float, { nullable: true })
  deliveryFee?: number;

  @Field(() => ID, { nullable: true })
  deliveryLocationId?: string;

  @Field({ nullable: true })
  deliveryLocationName?: string;

  @Field(() => Float, { nullable: true })
  amountPaid?: number;

  @Field({ nullable: true })
  transferProofUrl?: string;

  @Field({ nullable: true })
  paymentReference?: string;

  @Field({ nullable: true })
  notes?: string;
}



