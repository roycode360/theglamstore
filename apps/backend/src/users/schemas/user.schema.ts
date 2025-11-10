import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ObjectType, Field, ID } from '@nestjs/graphql';

export type UserDocument = HydratedDocument<UserModel>;

@Schema({ timestamps: true })
export class UserModel {
  @Prop({ required: true, type: String }) fullName!: string;
  @Prop({ required: false, type: String, default: null }) avatar?:
    | string
    | null;
  @Prop({ required: true, unique: true }) email!: string;
  @Prop({ required: true, enum: ['customer', 'admin'], default: 'customer' })
  role!: 'customer' | 'admin';
  @Prop({ type: Boolean, default: false }) emailVerified!: boolean;
  @Prop({ type: Date, default: null }) lastLoginAt?: Date | null;
  @Prop({ type: Date, default: null }) lastSeenAt?: Date | null;
  @Prop({ type: String, default: null }) country?: string | null;
  @Prop({ type: String, default: null }) region?: string | null;
  @Prop({ type: Number, default: 0 }) totalLogins?: number;
}

@ObjectType()
export class User {
  @Field(() => ID)
  _id!: string;

  @Field()
  fullName!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  avatar?: string;

  @Field({ defaultValue: 'customer' })
  role!: 'customer' | 'admin';

  @Field({ defaultValue: false })
  emailVerified!: boolean;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date | null;

  @Field(() => Date, { nullable: true })
  lastSeenAt?: Date | null;

  @Field(() => String, { nullable: true })
  country?: string | null;

  @Field(() => String, { nullable: true })
  region?: string | null;

  @Field(() => Number, { nullable: true })
  totalLogins?: number | null;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
