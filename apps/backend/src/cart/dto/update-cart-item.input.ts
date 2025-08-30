import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

@InputType()
export class UpdateCartItemInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  cartItemId: string;

  @Field(() => Int)
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;
}
