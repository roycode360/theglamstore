import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponDocument, CouponModel } from './schemas/coupon.schema';
import {
  UserCouponDocument,
  UserCouponModel,
} from './schemas/user-coupon.schema';

export interface CouponValidation {
  valid: boolean;
  message?: string;
  discountAmount?: number;
  newTotal?: number;
  coupon?: { code: string };
}

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(CouponModel.name)
    private readonly couponModel: Model<CouponDocument>,
    @InjectModel(UserCouponModel.name)
    private readonly userCouponModel: Model<UserCouponDocument>,
  ) {}

  async create(dto: CreateCouponDto): Promise<CouponDocument> {
    const payload = {
      code: dto.code.trim().toUpperCase(),
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minOrderAmount: dto.minOrderAmount ?? undefined,
      maxDiscount: dto.maxDiscount ?? undefined,
      usageLimit: dto.usageLimit ?? undefined,
      expiresAt: new Date(dto.expiresAt),
      isActive: dto.isActive ?? true,
      createdBy: dto.createdBy ?? undefined,
    } as Partial<CouponModel>;
    return await this.couponModel.create(payload);
  }

  async list(): Promise<Array<CouponModel & { _id: any }>> {
    return await this.couponModel
      .find()
      .sort({ createdAt: -1 })
      .lean<Array<CouponModel & { _id: any }>>();
  }

  async popular(limit = 3): Promise<Array<CouponModel & { _id: any }>> {
    return await this.couponModel
      .find({ isActive: true })
      .sort({ usedCount: -1, createdAt: -1 })
      .limit(limit)
      .lean<Array<CouponModel & { _id: any }>>();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.couponModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async update(
    id: string,
    dto: UpdateCouponDto,
  ): Promise<(CouponModel & { _id: any }) | null> {
    const payload: Partial<CouponModel> = {};
    if (dto.code !== undefined) {
      payload.code = dto.code.trim().toUpperCase();
    }
    if (dto.discountType !== undefined) {
      payload.discountType = dto.discountType;
    }
    if (dto.discountValue !== undefined) {
      payload.discountValue = dto.discountValue;
    }
    if (dto.minOrderAmount !== undefined) {
      payload.minOrderAmount = dto.minOrderAmount;
    }
    if (dto.maxDiscount !== undefined) {
      payload.maxDiscount = dto.maxDiscount;
    }
    if (dto.usageLimit !== undefined) {
      payload.usageLimit = dto.usageLimit;
    }
    if (dto.expiresAt !== undefined) {
      payload.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    }
    if (dto.isActive !== undefined) {
      payload.isActive = dto.isActive;
    }
    if (dto.createdBy !== undefined) {
      payload.createdBy = dto.createdBy || undefined;
    }

    if (Object.keys(payload).length === 0) {
      const existing = await this.couponModel
        .findById(id)
        .lean<CouponModel & { _id: any }>();
      return existing ?? null;
    }

    const updated = await this.couponModel
      .findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      })
      .lean<CouponModel & { _id: any }>();
    return updated ?? null;
  }

  async setActive(
    id: string,
    isActive: boolean,
  ): Promise<(CouponModel & { _id: any }) | null> {
    const updated = await this.couponModel
      .findByIdAndUpdate(id, { isActive }, { new: true, runValidators: true })
      .lean<CouponModel & { _id: any }>();
    return updated ?? null;
  }

  async validateCoupon(dto: ValidateCouponDto): Promise<CouponValidation> {
    const now = new Date();
    const code = dto.code.trim().toUpperCase();
    const orderTotal = Number(dto.orderAmount) || 0;

    const coupon = await this.couponModel.findOne({ code }).lean<CouponModel>();
    if (!coupon || !coupon.isActive) {
      return { valid: false, message: 'Coupon expired or invalid' };
    }
    if (
      coupon.expiresAt &&
      new Date(coupon.expiresAt).getTime() < now.getTime()
    ) {
      return { valid: false, message: 'Coupon expired or invalid' };
    }
    if (
      typeof coupon.usageLimit === 'number' &&
      typeof coupon.usedCount === 'number' &&
      coupon.usageLimit > 0 &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }
    if (
      typeof coupon.minOrderAmount === 'number' &&
      orderTotal < coupon.minOrderAmount
    ) {
      return { valid: false, message: 'Minimum spend not met' };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderTotal * (coupon.discountValue || 0)) / 100;
      if (
        typeof coupon.maxDiscount === 'number' &&
        discountAmount > coupon.maxDiscount
      ) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue || 0;
    }

    if (discountAmount < 0) discountAmount = 0;
    const newTotal = Math.max(0, orderTotal - discountAmount);

    const msgPrefix =
      coupon.discountType === 'percentage'
        ? `${coupon.discountValue}%`
        : `₦${coupon.discountValue}`;

    return {
      valid: true,
      discountAmount,
      newTotal,
      message: `${msgPrefix} off applied successfully!`,
      coupon: { code: coupon.code },
    };
  }

  // Call after order completion to increment usage count atomically
  async incrementUsage(code: string, userId?: string): Promise<void> {
    const upper = code.trim().toUpperCase();
    await this.couponModel.updateOne(
      { code: upper },
      { $inc: { usedCount: 1 } },
      { upsert: false },
    );
    if (userId) {
      try {
        await this.userCouponModel.updateOne(
          { userId, code: upper },
          { $setOnInsert: { userId, code: upper } },
          { upsert: true },
        );
      } catch {
        // ignore duplicate usage record errors
      }
    }
  }
}
