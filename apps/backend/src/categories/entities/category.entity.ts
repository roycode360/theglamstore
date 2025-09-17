import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Category {
  @Field(() => ID)
  _id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  image?: string;

  @Field(() => Int)
  sortOrder!: number;

  @Field({ nullable: true })
  parentId?: string;

  @Field()
  active!: boolean;
}
