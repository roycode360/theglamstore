import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateCategoryInput {
  @Field() name!: string;
  @Field() slug!: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) image?: string;
  @Field(() => Int, { defaultValue: 0 }) sortOrder!: number;
  @Field({ nullable: true }) parentId?: string;
  @Field({ defaultValue: true }) active!: boolean;
}
