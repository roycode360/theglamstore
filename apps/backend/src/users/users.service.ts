import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, UserModel, User } from './schemas/user.schema';
import { AccountRole } from 'src/types';

export type LeanUserRecord = {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string | null;
  role: 'customer' | 'admin';
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date | null;
  lastSeenAt?: Date | null;
  country?: string | null;
  region?: string | null;
  totalLogins?: number | null;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserModel.name) private userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<LeanUserRecord | null> {
    return this.userModel.findOne({ email }).lean<LeanUserRecord | null>();
  }

  async findById(id: string): Promise<
    | (LeanUserRecord & {
        emailVerified?: boolean;
      })
    | null
  > {
    return this.userModel.findById(id).lean<
      | (LeanUserRecord & {
          emailVerified?: boolean;
        })
      | null
    >();
  }

  async createUser(
    email: string,
    role: AccountRole,
    emailVerified: boolean,
    fullName: string,
    avatar?: string,
  ): Promise<User> {
    const created = await this.userModel.create({
      email,
      role,
      emailVerified,
      avatar,
      fullName,
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

  async recordLogin(userId: string, opts?: { country?: string | null }) {
    const update: Record<string, unknown> = {
      lastLoginAt: new Date(),
      lastSeenAt: new Date(),
    };
    if (opts?.country) {
      update.country = opts.country;
    }
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: update,
        $inc: { totalLogins: 1 },
      },
    );
  }

  async recordActivity(userId: string, opts?: { country?: string | null }) {
    if (!userId) return;
    const update: Record<string, unknown> = { lastSeenAt: new Date() };
    if (opts?.country) {
      update.country = opts.country;
    }
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: update,
      },
    );
  }

  async listBasicUsers(filter: {
    search?: string | null;
    country?: string | null;
    skip?: number;
    limit?: number;
  }): Promise<{
    items: LeanUserRecord[];
    total: number;
  }> {
    const query: Record<string, unknown> = {};
    if (filter.search) {
      const regex = new RegExp(filter.search, 'i');
      query.$or = [{ fullName: regex }, { email: regex }];
    }
    if (filter.country) {
      query.country = filter.country;
    }
    const skip = Math.max(0, filter.skip ?? 0);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 25));
    const [items, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<LeanUserRecord[]>(),
      this.userModel.countDocuments(query),
    ]);
    return { items, total };
  }
}
