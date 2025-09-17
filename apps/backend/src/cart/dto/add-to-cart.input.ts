import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

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
  @IsString()
  @IsOptional()
  selectedSize: string;

  @Field()
  @IsOptional()
  @IsString()
  selectedColor: string;
}
