import { Field, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class SubmitReviewInput {
  @Field(() => ID)
  productId!: string;

  @Field(() => ID, { nullable: true })
  orderId?: string;

  @Field(() => String, { nullable: true })
  orderNumber?: string;

  @Field()
  displayName!: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;

  @Field(() => Int)
  rating!: number;

  @Field()
  message!: string;
}
