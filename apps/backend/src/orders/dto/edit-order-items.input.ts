import {
  Field,
  Float,
  InputType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';

export enum EditOp {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  UPDATE = 'UPDATE',
}

registerEnumType(EditOp, { name: 'EditOp' });

@InputType()
export class EditOrderItemInput {
  @Field(() => EditOp)
  op!: EditOp;

  @Field()
  productId!: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Int, { nullable: true })
  quantity?: number;

  @Field({ nullable: true })
  selectedSize?: string;

  @Field({ nullable: true })
  selectedColor?: string;

  @Field({ nullable: true })
  image?: string;
}

@InputType()
export class EditOrderItemsInput {
  @Field()
  orderId!: string;

  @Field(() => [EditOrderItemInput])
  operations!: EditOrderItemInput[];

  @Field({ nullable: true })
  note?: string;
}
