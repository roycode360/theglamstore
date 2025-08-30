import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ObjectType, Field, ID } from '@nestjs/graphql';

export type UserDocument = HydratedDocument<UserModel>;

@Schema({ timestamps: true })
export class UserModel {
  @Prop({ required: true, unique: true }) email!: string;
  @Prop({ required: true, enum: ['customer', 'admin'], default: 'customer' })
  role!: 'customer' | 'admin';
  @Prop({ type: String, default: null }) refreshTokenHash?: string | null;
  @Prop({ type: Boolean, default: false }) emailVerified!: boolean;
  @Prop({ type: String, default: null }) verificationCode?: string | null;
  @Prop({ type: Date, default: null }) verificationExpires?: Date | null;
}

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  role!: string;

  @Field()
  emailVerified!: boolean;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
