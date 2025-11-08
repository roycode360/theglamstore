import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Founder {
  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String)
  imageUrl!: string;

  @Field(() => Int, { nullable: true })
  order?: number | null;

  @Field(() => Boolean, { nullable: true })
  visible?: boolean | null;
}

@ObjectType()
export class CompanySettings {
  @Field(() => ID)
  _id!: string;

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

  @Field(() => Boolean)
  promoEnabled!: boolean;

  @Field(() => String, { nullable: true })
  promoTitle?: string | null;

  @Field(() => String, { nullable: true })
  promoSubtitle?: string | null;

  @Field(() => String, { nullable: true })
  promoMessage?: string | null;

  @Field(() => String, { nullable: true })
  promoImageUrl?: string | null;

  @Field(() => String, { nullable: true })
  promoCtaLabel?: string | null;

  @Field(() => String, { nullable: true })
  promoCtaLink?: string | null;

  @Field(() => Int, { nullable: true })
  promoDelaySeconds?: number | null;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => [Founder], { nullable: true })
  founders?: Founder[] | null;
}
