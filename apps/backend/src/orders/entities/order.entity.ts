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

  @Field(() => String, { nullable: true })
  orderNumber?: string | null;

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
  total!: number;

  @Field(() => Number, { nullable: true })
  shippingFee?: number | null; // kept for compatibility

  // Delivery fields
  @Field(() => Number, { nullable: true })
  deliveryFee?: number | null;

  @Field(() => String, { nullable: true })
  deliveryLocationId?: string | null;

  @Field(() => String, { nullable: true })
  deliveryLocationName?: string | null;

  @Field({ nullable: true })
  couponCode?: string;

  @Field(() => Number, { nullable: true })
  couponDiscount?: number;

  @Field()
  paymentMethod!: string;

  @Field()
  status!:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'awaiting_additional_payment';

  @Field({ nullable: true })
  transferProofUrl?: string;

  @Field(() => [OrderItem])
  items!: OrderItem[];

  @Field(() => Number, { nullable: true })
  amountPaid?: number;

  @Field(() => Number, { nullable: true })
  amountRefunded?: number;

  @Field(() => Number, { nullable: true })
  balanceDue?: number;

  @Field({ nullable: true })
  source?: string;

  @Field(() => String, { nullable: true })
  paymentReference?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

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
