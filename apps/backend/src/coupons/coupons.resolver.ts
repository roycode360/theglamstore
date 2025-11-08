import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CouponsService } from './coupons.service';
import { isPublic } from '../auth/decorators';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { UseGuards } from '@nestjs/common';
import {
  Coupon,
  CouponValidationResult,
  CouponDiscountType,
} from './entities/coupon.entity';
import { CouponDocument, CouponModel } from './schemas/coupon.schema';
import { Types } from 'mongoose';
import { CouponValidation } from './coupons.service';
import { CreateCouponInput } from './dto/create-coupon.input';
import { UpdateCouponInput } from './dto/update-coupon.input';

@Resolver(() => Coupon)
export class CouponsResolver {
  constructor(private readonly coupons: CouponsService) {}

  @UseGuards(RolesGuard)
  @Mutation(() => Coupon)
  @Roles('admin')
  async createCoupon(@Args('input') input: CreateCouponInput): Promise<Coupon> {
    const created = await this.coupons.create({
      code: input.code,
      discountType: input.discountType as unknown as 'percentage' | 'fixed',
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      maxDiscount: input.maxDiscount,
      usageLimit: input.usageLimit,
      expiresAt: input.expiresAt.toISOString(),
      isActive: input.isActive,
      createdBy: input.createdBy,
    });
    return this.toGraphQL(created);
  }

  @UseGuards(RolesGuard)
  @Mutation(() => Boolean)
  @Roles('admin')
  async deleteCoupon(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return await this.coupons.delete(id);
  }

  @UseGuards(RolesGuard)
  @Mutation(() => Coupon, { nullable: true })
  @Roles('admin')
  async updateCoupon(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCouponInput,
  ): Promise<Coupon | null> {
    const updated = await this.coupons.update(id, {
      code: input.code,
      discountType: input.discountType as unknown as 'percentage' | 'fixed',
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      maxDiscount: input.maxDiscount,
      usageLimit: input.usageLimit,
      expiresAt: input.expiresAt ? input.expiresAt.toISOString() : undefined,
      isActive: input.isActive,
      createdBy: input.createdBy,
    });
    if (!updated) return null;
    return this.toGraphQL(updated);
  }

  @UseGuards(RolesGuard)
  @Mutation(() => Coupon, { nullable: true })
  @Roles('admin')
  async setCouponActive(
    @Args('id', { type: () => ID }) id: string,
    @Args('isActive', { type: () => Boolean }) isActive: boolean,
  ): Promise<Coupon | null> {
    const updated = await this.coupons.setActive(id, isActive);
    if (!updated) return null;
    return this.toGraphQL(updated);
  }

  @UseGuards(RolesGuard)
  @Query(() => [Coupon])
  @Roles('admin')
  async listCoupons(): Promise<Coupon[]> {
    const docs = await this.consumableList();
    return docs;
  }

  @UseGuards(RolesGuard)
  @Query(() => [Coupon])
  @Roles('admin')
  async popularCoupons(
    @Args('limit', { type: () => Number, nullable: true }) limit?: number,
  ): Promise<Coupon[]> {
    const docs = await this.coupons.popular(limit ?? 3);
    return docs.map((d) => this.toGraphQL(d));
  }

  private async consumableList(): Promise<Coupon[]> {
    const docs = await this.coupons.list();
    return docs.map((d) => this.toGraphQL(d));
  }

  private toGraphQL(
    d:
      | CouponDocument
      | (CouponModel & {
          _id: Types.ObjectId;
          usedCount?: number;
          expiresAt?: Date;
          createdAt?: Date;
          updatedAt?: Date;
        }),
  ): Coupon {
    const id = (d as { _id: { toString(): string } })._id.toString();
    const usedCount = (d as { usedCount?: number }).usedCount ?? 0;
    const expiresAt = (d as { expiresAt?: Date }).expiresAt as Date;
    const createdAt = (d as { createdAt?: Date }).createdAt as Date;
    const updatedAt = (d as { updatedAt?: Date }).updatedAt as Date;
    return {
      _id: id,
      code: d.code,
      discountType: d.discountType as unknown as CouponDiscountType,
      discountValue: d.discountValue,
      minOrderAmount: d.minOrderAmount ?? null,
      maxDiscount: d.maxDiscount ?? null,
      usageLimit: d.usageLimit ?? null,
      isActive: d.isActive,
      usedCount,
      expiresAt,
      createdBy: d.createdBy,
      createdAt,
      updatedAt,
    };
  }

  @isPublic()
  @Query(() => CouponValidationResult)
  async validateCoupon(
    @Args('code') code: string,
    @Args('orderAmount') orderAmount: number,
    @Args('userId', { nullable: true }) userId?: string,
  ): Promise<CouponValidationResult> {
    const res: CouponValidation = await this.coupons.validateCoupon({
      code,
      orderAmount,
      userId,
    });
    return {
      valid: !!res.valid,
      message: res.message,
      discountAmount: res.discountAmount ?? null,
      newTotal: res.newTotal ?? null,
      code,
    } as CouponValidationResult;
  }
}
