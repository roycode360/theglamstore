import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { Product } from '../products/entities/product.entity';

@Resolver()
@UseGuards(GqlAuthGuard)
export class WishlistResolver {
  constructor(private readonly wishlist: WishlistService) {}

  @Query(() => [Product])
  async listWishlist(@CurrentUser() user: AuthUser): Promise<Product[]> {
    return this.wishlist.list(user.id);
  }

  @Mutation(() => Boolean)
  async addToWishlist(
    @Args('productId', { type: () => String }) productId: string,
    @Args('selectedSize', { type: () => String, nullable: true })
    selectedSize: string,
    @Args('selectedColor', { type: () => String, nullable: true })
    selectedColor: string,
    @CurrentUser() user: AuthUser,
  ): Promise<boolean> {
    await this.wishlist.add(user.id, {
      productId,
      selectedSize,
      selectedColor,
    });
    return true;
  }

  @Mutation(() => Boolean)
  async removeFromWishlist(
    @Args('productId', { type: () => String }) productId: string,
    @Args('selectedSize', { type: () => String, nullable: true })
    selectedSize: string,
    @Args('selectedColor', { type: () => String, nullable: true })
    selectedColor: string,
    @CurrentUser() user: AuthUser,
  ): Promise<boolean> {
    await this.wishlist.remove(user.id, {
      productId,
      selectedSize,
      selectedColor,
    });
    return true;
  }
}
