import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddToCartInput } from './dto/add-to-cart.input';
import { UpdateCartItemInput } from './dto/update-cart-item.input';
import { RemoveFromCartInput } from './dto/remove-from-cart.input';
import { CartItem, CartItemDocument } from './cart-item.schema';
import { CartItemType } from './cart-item.entity';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(CartItem.name) private cartItemModel: Model<CartItemDocument>,
  ) {}

  async addToCart(
    userId: string,
    input: AddToCartInput,
  ): Promise<CartItemType> {
    const { productId, quantity, selectedSize, selectedColor } = input;

    const normalizedQuantity = Number(quantity);
    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      throw new BadRequestException('Quantity must be a positive number');
    }

    const userObjectId = new Types.ObjectId(userId);
    const productObjectId = new Types.ObjectId(productId);

    const filter: Record<string, unknown> = {
      userId: userObjectId,
      productId: productObjectId,
      selectedSize: selectedSize ?? null,
      selectedColor: selectedColor ?? null,
    };

    const setOnInsert: Partial<CartItem> = {
      userId: userObjectId,
      productId: productObjectId,
    };

    if (typeof selectedSize === 'string') {
      setOnInsert.selectedSize = selectedSize;
    }
    if (typeof selectedColor === 'string') {
      setOnInsert.selectedColor = selectedColor;
    }

    const cartItem = await this.cartItemModel
      .findOneAndUpdate(
        filter,
        {
          $inc: { quantity: normalizedQuantity },
          $setOnInsert: setOnInsert,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )
      .populate('productId')
      .exec();

    if (!cartItem) {
      throw new Error('Failed to add item to cart');
    }

    const product = cartItem.productId as unknown as Product;

    // Return mapped object for GraphQL
    return { ...cartItem.toObject(), product };
  }

  async updateCartItem(
    userId: string,
    input: UpdateCartItemInput,
  ): Promise<CartItemType> {
    const { cartItemId, quantity } = input;

    const cartItem = await this.cartItemModel
      .findOne({
        _id: new Types.ObjectId(cartItemId),
        userId: new Types.ObjectId(userId),
      })
      .populate('productId')
      .exec();

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    const product = cartItem.productId as unknown as Product;
    return { ...cartItem.toObject(), product };
  }

  async removeFromCart(
    userId: string,
    input: RemoveFromCartInput,
  ): Promise<boolean> {
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

  async getCartItems(userId: string): Promise<CartItemType[]> {
    const cartItems = await this.cartItemModel
      .find({ userId: new Types.ObjectId(userId) })
      .lean()
      .populate('productId')
      .sort({ createdAt: -1 })
      .exec();

    const transformedCartData = cartItems.map((item) => ({
      ...item,
      product: item.productId as unknown as Product,
    }));

    // console.log(transformedCartData);

    return transformedCartData;
  }

  async getCartItemCount(userId: string): Promise<number> {
    const result = await this.cartItemModel.find({
      userId: new Types.ObjectId(userId),
    });

    return result?.length;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await this.cartItemModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });

    return result.deletedCount > 0;
  }
}
