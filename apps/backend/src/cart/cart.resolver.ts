import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartItem } from './cart.entity';
import { AddToCartInput } from './dto/add-to-cart.input';
import { UpdateCartItemInput } from './dto/update-cart-item.input';
import { RemoveFromCartInput } from './dto/remove-from-cart.input';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver(() => CartItem)
@UseGuards(GqlAuthGuard)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Mutation(() => CartItem)
  async addToCart(
    @Args('input') input: AddToCartInput,
    @CurrentUser() user: any,
  ): Promise<CartItem> {
    return this.cartService.addToCart(user.id, input);
  }

  @Mutation(() => CartItem)
  async updateCartItem(
    @Args('input') input: UpdateCartItemInput,
    @CurrentUser() user: any,
  ): Promise<CartItem> {
    return this.cartService.updateCartItem(user.id, input);
  }

  @Mutation(() => Boolean)
  async removeFromCart(
    @Args('input') input: RemoveFromCartInput,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    return this.cartService.removeFromCart(user.id, input);
  }

  @Query(() => [CartItem])
  async getCartItems(@CurrentUser() user: any): Promise<CartItem[]> {
    return this.cartService.getCartItems(user.id);
  }

  @Query(() => Number)
  async getCartItemCount(@CurrentUser() user: any): Promise<number> {
    return this.cartService.getCartItemCount(user.id);
  }

  @Mutation(() => Boolean)
  async clearCart(@CurrentUser() user: any): Promise<boolean> {
    return this.cartService.clearCart(user.id);
  }
}
