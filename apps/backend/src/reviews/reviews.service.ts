import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ReviewDocument,
  ReviewModel,
  ReviewStatus,
} from './schemas/review.schema.js';
import { SubmitReviewInput } from './dto/submit-review.input.js';
import { OrdersService, OrderDTO } from '../orders/orders.service.js';
import {
  ProductDocument,
  ProductModel,
} from '../products/schemas/product.schema.js';
import { ReviewStatusEnum } from './entities/review.entity.js';
import { ModerateReviewInput } from './dto/moderate-review.input.js';
import { EmailService } from '../auth/email.service.js';

export type ReviewDTO = {
  _id: string;
  productId: string;
  productName: string;
  productSlug?: string | null;
  productImage?: string | null;
  orderId: string;
  orderNumber?: string | null;
  customerId: string;
  customerEmail: string;
  customerName: string;
  customerAvatarUrl?: string | null;
  rating: number;
  message: string;
  status: ReviewStatus;
  moderatedBy?: string | null;
  moderatedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbReview = Omit<ReviewDTO, '_id'> & { _id: unknown };

type ReviewEligibilityResult = {
  hasPurchased: boolean;
  canReview: boolean;
  existingReview: ReviewDTO | null;
};

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(ReviewModel.name)
    private readonly reviewModel: Model<ReviewDocument>,
    private readonly orders: OrdersService,
    @InjectModel(ProductModel.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly email: EmailService,
  ) {}

  private normalize(doc: DbReview): ReviewDTO {
    return {
      ...doc,
      _id: String(doc._id),
      productSlug: doc.productSlug ?? null,
      productImage: doc.productImage ?? null,
      orderNumber: doc.orderNumber ?? null,
      customerAvatarUrl: doc.customerAvatarUrl ?? null,
      moderatedBy: doc.moderatedBy ?? null,
      moderatedAt: doc.moderatedAt ?? null,
      rejectionReason: doc.rejectionReason ?? null,
    };
  }

  private clampRating(rating: number): number {
    if (!Number.isFinite(rating)) return 1;
    return Math.min(5, Math.max(1, Math.round(rating)));
  }

  async submitReview(
    user: { id: string; email: string },
    input: SubmitReviewInput,
  ): Promise<ReviewDTO> {
    const displayName = input.displayName?.trim();
    if (!displayName) {
      throw new Error('Display name is required');
    }
    const message = input.message?.trim();
    if (!message) {
      throw new Error('Review message is required');
    }
    const rating = this.clampRating(input.rating);

    const product = await this.productModel
      .findById(input.productId)
      .select('name slug images')
      .lean<{
        _id: unknown;
        name?: string;
        slug?: string;
        images?: string[];
      } | null>();

    if (!product || !product.name) {
      throw new Error('Product not found');
    }

    const existingReview = await this.reviewModel
      .findOne({
        productId: input.productId,
        customerId: user.id,
      })
      .lean<DbReview | null>();

    if (existingReview) {
      throw new Error('You have already submitted a review for this product.');
    }

    const order = await this.findEligibleOrder({
      userEmail: user.email,
      productId: input.productId,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
    });

    if (!order) {
      throw new Error(
        'You need to purchase this product before submitting a review.',
      );
    }

    const avatarUrl =
      input.avatarUrl && input.avatarUrl.trim().length > 0
        ? input.avatarUrl.trim()
        : null;

    const doc = await this.reviewModel.create({
      productId: input.productId,
      productName: product.name,
      productSlug: product.slug ?? null,
      productImage:
        Array.isArray(product.images) && product.images.length > 0
          ? product.images[0]
          : null,
      orderId: order._id,
      orderNumber: order.orderNumber ?? null,
      customerId: user.id,
      customerEmail: user.email,
      customerName: displayName,
      customerAvatarUrl: avatarUrl,
      rating,
      message,
      status: 'pending',
    });

    await this.notifyAdminsPendingReview({
      productName: product.name,
      productId: input.productId,
      rating,
      message,
      customerName: displayName,
      orderNumber: order.orderNumber ?? null,
    });

    const created = await this.reviewModel
      .findById(doc._id)
      .lean<DbReview | null>();

    if (!created) {
      throw new Error('Unable to load created review');
    }

    return this.normalize(created);
  }

  async listProductReviews(productId: string): Promise<ReviewDTO[]> {
    const docs = await this.reviewModel
      .find({ productId, status: 'approved' })
      .sort({ createdAt: -1 })
      .lean<DbReview[]>();

    return docs.map((doc) => this.normalize(doc));
  }

  async listPendingReviews(limit = 50): Promise<ReviewDTO[]> {
    const docs = await this.reviewModel
      .find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean<DbReview[]>();

    return docs.map((doc) => this.normalize(doc));
  }

  async moderateReview(
    admin: { id: string; email: string },
    input: ModerateReviewInput,
  ): Promise<ReviewDTO> {
    const review = await this.reviewModel
      .findById(input.reviewId)
      .lean<DbReview | null>();

    if (!review) {
      throw new Error('Review not found');
    }

    const nextStatus =
      input.action === 'approve'
        ? ReviewStatusEnum.APPROVED
        : ReviewStatusEnum.REJECTED;

    const update: Partial<ReviewModel> & {
      status: ReviewStatus;
      moderatedBy: string;
      moderatedAt: Date;
      rejectionReason: string | null;
    } = {
      status: nextStatus,
      moderatedBy: admin.id,
      moderatedAt: new Date(),
      rejectionReason:
        input.action === 'reject'
          ? input.reason?.trim() || 'Review rejected'
          : null,
    };

    await this.reviewModel.updateOne({ _id: input.reviewId }, { $set: update });

    const updated = await this.reviewModel
      .findById(input.reviewId)
      .lean<DbReview | null>();

    if (!updated) {
      throw new Error('Unable to load updated review');
    }

    if (updated.status === 'approved' || review.status === 'approved') {
      await this.recalculateProductRating(updated.productId);
    }

    return this.normalize(updated);
  }

  private async findEligibleOrder(params: {
    userEmail: string;
    productId: string;
    orderId?: string;
    orderNumber?: string;
  }): Promise<OrderDTO | null> {
    const { userEmail, productId, orderId, orderNumber } = params;

    return this.orders.findCustomerOrderForProduct({
      email: userEmail,
      productId,
      orderId: orderId ?? null,
      orderNumber: orderNumber ?? null,
    });
  }

  private async recalculateProductRating(productId: string): Promise<void> {
    const aggregates = await this.reviewModel.aggregate<{
      _id: string;
      averageRating: number;
      count: number;
    }>([
      { $match: { productId, status: 'approved' } },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = aggregates[0];
    const count = summary?.count ?? 0;
    const average =
      count > 0 && typeof summary?.averageRating === 'number'
        ? Number(summary.averageRating.toFixed(2))
        : null;

    await this.productModel.updateOne(
      { _id: productId },
      {
        $set: {
          reviewCount: count,
          reviewAverage: average,
        },
      },
    );
  }

  private async notifyAdminsPendingReview(params: {
    productName: string;
    productId: string;
    rating: number;
    message: string;
    customerName: string;
    orderNumber: string | null;
  }): Promise<void> {
    try {
      await this.email.sendPendingReviewNotification({
        productName: params.productName,
        productId: params.productId,
        rating: params.rating,
        message: params.message,
        customerName: params.customerName,
        orderNumber: params.orderNumber ?? undefined,
      });
    } catch (error) {
      // Do not block review submission if notification fails
      console.error('Failed to send pending review notification:', error);
    }
  }

  async getReviewEligibility(
    user: { id: string; email: string },
    productId: string,
  ): Promise<ReviewEligibilityResult> {
    const existing = await this.reviewModel
      .findOne({ productId, customerId: user.id })
      .lean<DbReview | null>();

    const order = await this.orders.findCustomerOrderForProduct({
      email: user.email,
      productId,
      orderId: null,
      orderNumber: null,
    });

    const hasPurchased = !!order;
    const canReview = hasPurchased && !existing;

    return {
      hasPurchased,
      canReview,
      existingReview: existing ? this.normalize(existing) : null,
    };
  }
}
