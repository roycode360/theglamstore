import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OrderItem {
  @Field()
  productId!: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => Number, { nullable: true })
  price?: number;

  @Field(() => Number, { nullable: true })
  quantity?: number;

  @Field({ nullable: true })
  selectedSize?: string;

  @Field({ nullable: true })
  selectedColor?: string;

  @Field({ nullable: true })
  image?: string;
}

@ObjectType()
export class Order {
  @Field(() => ID)
  _id!: string;

  @Field()
  email!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  address1!: string;

  @Field()
  city!: string;

  @Field()
  state!: string;

  @Field(() => Number)
  subtotal!: number;

  @Field(() => Number)
  tax!: number;

  @Field(() => Number)
  total!: number;

  @Field()
  paymentMethod!: string;

  @Field()
  status!:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';

  @Field({ nullable: true })
  transferProofUrl?: string;

  @Field(() => [OrderItem])
  items!: OrderItem[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class OrderPage {
  @Field(() => [Order])
  items!: Order[];

  @Field(() => Number)
  total!: number;

  @Field(() => Number)
  page!: number;

  @Field(() => Number)
  pageSize!: number;

  @Field(() => Number)
  totalPages!: number;
}
