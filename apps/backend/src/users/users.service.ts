import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, UserModel } from './schemas/user.schema';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserModel.name) private userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).lean<User | null>();
  }

  async findById(id: string): Promise<
    | (User & {
        emailVerified?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
      })
    | null
  > {
    return this.userModel.findById(id).lean<
      | (User & {
          emailVerified?: boolean;
          createdAt?: Date;
          updatedAt?: Date;
        })
      | null
    >();
  }

  async createUser(email: string, role: 'customer' | 'admin'): Promise<User> {
    const created = await this.userModel.create({
      email,
      role,
      emailVerified: false,
    });
    return created.toObject() as unknown as User;
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
