import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class RemoveFromCartInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  cartItemId: string;
}
