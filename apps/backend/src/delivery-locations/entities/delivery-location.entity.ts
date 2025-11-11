import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DeliveryLocation {
  @Field(() => ID)
  _id!: string;

  @Field()
  name!: string;

  @Field(() => Float)
  price!: number;

  @Field()
  active!: boolean;

  @Field()
  isDefault!: boolean;
}


