import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class RecordPaymentInput {
  @Field()
  orderId!: string;

  @Field(() => Float)
  amount!: number;

  @Field({ nullable: true })
  note?: string;

  @Field({ nullable: true })
  transferProofUrl?: string;
}
