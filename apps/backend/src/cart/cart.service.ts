import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CartItem, CartItemDocument } from './cart.entity';
import { AddToCartInput } from './dto/add-to-cart.input';
import { UpdateCartItemInput } from './dto/update-cart-item.input';
import { RemoveFromCartInput } from './dto/remove-from-cart.input';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(CartItem.name) private cartItemModel: Model<CartItemDocument>,
  ) {}

  async addToCart(userId: string, input: AddToCartInput): Promise<CartItem> {
    const { productId, quantity, selectedSize, selectedColor } = input;
    
    // Check if item already exists in cart with same size and color
    const existingItem = await this.cartItemModel.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      selectedSize,
      selectedColor,
    });

    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity += quantity;
      return await existingItem.save();
    }

    // Create new cart item
    const cartItem = new this.cartItemModel({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      quantity,
      selectedSize,
      selectedColor,
    });

    return await cartItem.save();
  }

  async updateCartItem(userId: string, input: UpdateCartItemInput): Promise<CartItem> {
    const { cartItemId, quantity } = input;
    
    const cartItem = await this.cartItemModel.findOne({
      _id: new Types.ObjectId(cartItemId),
      userId: new Types.ObjectId(userId),
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    cartItem.quantity = quantity;
    return await cartItem.save();
  }

  async removeFromCart(userId: string, input: RemoveFromCartInput): Promise<boolean> {
    const { cartItemId } = input;
    
    const result = await this.cartItemModel.deleteOne({
      _id: new Types.ObjectId(cartItemId),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Cart item not found');
    }

    return true;
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    return await this.cartItemModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('productId')
      .sort({ createdAt: -1 });
  }

  async getCartItemCount(userId: string): Promise<number> {
    const result = await this.cartItemModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } },
    ]);
    
    return result.length > 0 ? result[0].totalQuantity : 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await this.cartItemModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
    
    return result.deletedCount > 0;
  }
}
