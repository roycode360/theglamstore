import { Field, Float, ID, InputType } from '@nestjs/graphql';

@InputType()
export class UpsertDeliveryLocationInput {
  @Field(() => ID, { nullable: true, name: '_id' })
  _id?: string;

  @Field()
  name!: string;

  @Field(() => Float)
  price!: number;

  @Field({ defaultValue: true })
  active!: boolean;

  @Field({ defaultValue: false })
  isDefault!: boolean;
}


