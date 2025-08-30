import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, UserModel } from './schemas/user.schema';

// Narrow type used for Lean results
export type UserLean = {
  _id: string;
  email: string;
  role: 'customer' | 'admin';
  refreshTokenHash?: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserModel.name) private userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserLean | null> {
    return this.userModel.findOne({ email }).lean<UserLean | null>();
  }

  async findById(id: string): Promise<
    | (UserLean & {
        emailVerified?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
      })
    | null
  > {
    return this.userModel.findById(id).lean<
      | (UserLean & {
          emailVerified?: boolean;
          createdAt?: Date;
          updatedAt?: Date;
        })
      | null
    >();
  }

  async createUser(
    email: string,
    role: 'customer' | 'admin',
  ): Promise<UserLean> {
    const created = await this.userModel.create({
      email,
      role,
      emailVerified: false,
    });
    return created.toObject() as unknown as UserLean;
  }

  async setRefreshTokenHash(userId: string, hash: string | null) {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshTokenHash: hash,
    });
  }

  async setRole(userId: string, role: 'customer' | 'admin') {
    await this.userModel.findByIdAndUpdate(userId, { role });
  }
}
