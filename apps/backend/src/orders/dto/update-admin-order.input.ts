import { Field, Float, ID, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateAdminOrderInput {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  address1?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field(() => String, { nullable: true })
  couponCode?: string | null;

  @Field(() => Float, { nullable: true })
  couponDiscount?: number;

  @Field(() => Float, { nullable: true })
  deliveryFee?: number;

  @Field(() => Float, { nullable: true })
  amountPaid?: number;

  @Field(() => Float, { nullable: true })
  amountRefunded?: number;

  @Field(() => String, { nullable: true })
  transferProofUrl?: string | null;

  @Field(() => String, { nullable: true })
  paymentReference?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;
}
