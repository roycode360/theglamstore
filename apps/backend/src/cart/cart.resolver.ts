import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartInput } from './dto/add-to-cart.input';
import { UpdateCartItemInput } from './dto/update-cart-item.input';
import { RemoveFromCartInput } from './dto/remove-from-cart.input';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from 'src/auth/auth.types';
import { CartItemType } from './cart-item.entity';

@Resolver(() => CartItemType)
@UseGuards(GqlAuthGuard)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Mutation(() => CartItemType)
  async addToCart(
    @Args('input') input: AddToCartInput,
    @CurrentUser() user: AuthUser,
  ): Promise<CartItemType> {
    return this.cartService.addToCart(user.id, input);
  }

  @Mutation(() => CartItemType)
  async updateCartItem(
    @Args('input') input: UpdateCartItemInput,
    @CurrentUser() user: AuthUser,
  ): Promise<CartItemType> {
    return this.cartService.updateCartItem(user.id, input);
  }

  @Mutation(() => Boolean)
  async removeFromCart(
    @Args('input') input: RemoveFromCartInput,
    @CurrentUser() user: AuthUser,
  ): Promise<boolean> {
    return this.cartService.removeFromCart(user.id, input);
  }

  // @isPublic()
  @Query(() => [CartItemType])
  async getCartItems(@CurrentUser() user: AuthUser): Promise<CartItemType[]> {
    return this.cartService.getCartItems(user.id);
  }

  @Query(() => Number)
  async getCartItemCount(@CurrentUser() user: AuthUser): Promise<number> {
    return this.cartService.getCartItemCount(user.id);
  }

  @Mutation(() => Boolean)
  async clearCart(@CurrentUser() user: AuthUser): Promise<boolean> {
    return this.cartService.clearCart(user.id);
  }
}
