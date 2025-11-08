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
}

@ObjectType()
export class User {
  @Field(() => ID)
  _id!: string;

  @Field()
  fullName!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ defaultValue: 'customer' })
  role!: 'customer' | 'admin';

  @Field({ defaultValue: false })
  emailVerified!: boolean;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
