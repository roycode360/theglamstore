import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class ModerateReviewInput {
  @Field(() => ID)
  reviewId!: string;

  @Field(() => String)
  action!: 'approve' | 'reject';

  @Field(() => String, { nullable: true })
  reason?: string | null;
}
