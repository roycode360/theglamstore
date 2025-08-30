import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

@InputType()
export class AddToCartInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  productId: string;

  @Field(() => Int)
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;

  @Field()
  @IsNotEmpty()
  @IsString()
  selectedSize: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  selectedColor: string;
}
