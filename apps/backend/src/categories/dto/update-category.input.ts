import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class UpdateCategoryInput {
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) slug?: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) image?: string;
  @Field(() => Int, { nullable: true }) sortOrder?: number;
  @Field({ nullable: true }) parentId?: string;
  @Field({ nullable: true }) active?: boolean;
}
