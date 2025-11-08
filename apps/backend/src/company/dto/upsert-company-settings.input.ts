import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class UpsertCompanySettingsInput {
  @Field({ nullable: true })
  businessName?: string;

  @Field({ nullable: true })
  accountName?: string;

  @Field({ nullable: true })
  accountNumber?: string;

  @Field({ nullable: true })
  bankName?: string;

  @Field({ nullable: true })
  contactEmail?: string;

  @Field({ nullable: true })
  contactPhone?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  accountInstructions?: string;

  @Field({ nullable: true })
  promoEnabled?: boolean;

  @Field({ nullable: true })
  promoTitle?: string;

  @Field({ nullable: true })
  promoSubtitle?: string;

  @Field({ nullable: true })
  promoMessage?: string;

  @Field({ nullable: true })
  promoImageUrl?: string;

  @Field({ nullable: true })
  promoCtaLabel?: string;

  @Field({ nullable: true })
  promoCtaLink?: string;

  @Field(() => Int, { nullable: true })
  promoDelaySeconds?: number;

  @Field(() => [FounderInput], { nullable: true })
  founders?: FounderInput[];
}

@InputType()
export class FounderInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field()
  imageUrl!: string;

  @Field(() => Int, { nullable: true })
  order?: number;

  @Field({ nullable: true })
  visible?: boolean;
}
