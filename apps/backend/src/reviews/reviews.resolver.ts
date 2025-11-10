import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { Review, ReviewEligibility } from './entities/review.entity.js';
import { SubmitReviewInput } from './dto/submit-review.input.js';
import { ModerateReviewInput } from './dto/moderate-review.input.js';
import { GqlAuthGuard } from '../auth/gql-auth.guard.js';
import { Roles, RolesGuard } from '../auth/roles.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AuthUser } from '../auth/auth.types.js';
import { isPublic } from '../auth/decorators.js';

@Resolver(() => Review)
export class ReviewsResolver {
  constructor(private readonly reviews: ReviewsService) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('customer')
  @Mutation(() => Review)
  async submitProductReview(
    @Args('input', { type: () => SubmitReviewInput })
    input: SubmitReviewInput,
    @CurrentUser() user: AuthUser,
  ): Promise<Review> {
    const created = await this.reviews.submitReview(
      { id: user.id, email: user.email },
      input,
    );
    return created as unknown as Review;
  }

  @isPublic()
  @Query(() => [Review])
  async listProductReviews(
    @Args('productId', { type: () => String }) productId: string,
  ): Promise<Review[]> {
    const reviews = await this.reviews.listProductReviews(productId);
    return reviews as unknown as Review[];
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => [Review])
  async listPendingReviews(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Review[]> {
    const safeLimit = limit && limit > 0 ? Math.min(limit, 200) : 50;
    const reviews = await this.reviews.listPendingReviews(safeLimit);
    return reviews as unknown as Review[];
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => Review)
  async moderateReview(
    @Args('input', { type: () => ModerateReviewInput })
    input: ModerateReviewInput,
    @CurrentUser() admin: AuthUser,
  ): Promise<Review> {
    const updated = await this.reviews.moderateReview(
      { id: admin.id, email: admin.email },
      input,
    );
    return updated as unknown as Review;
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('customer')
  @Query(() => ReviewEligibility)
  async getReviewEligibility(
    @Args('productId', { type: () => String }) productId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ReviewEligibility> {
    const eligibility = await this.reviews.getReviewEligibility(
      { id: user.id, email: user.email },
      productId,
    );
    return {
      hasPurchased: eligibility.hasPurchased,
      canReview: eligibility.canReview,
      existingReview: eligibility.existingReview as unknown as Review | null,
    };
  }
}
