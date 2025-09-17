import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WishlistItem, WishlistItemDocument } from './wishlist.schema';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistItem.name)
    private wishlistModel: Model<WishlistItemDocument>,
  ) {}

  async list(userId: string): Promise<Product[]> {
    const docs = await this.wishlistModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('productId')
      .lean()
      .exec();
    return docs.map((d: any) => d.productId as Product);
  }

  async add(
    userId: string,
    input: { productId: string; selectedSize?: string; selectedColor?: string },
  ): Promise<void> {
    await this.wishlistModel.updateOne(
      {
        userId: new Types.ObjectId(userId),
        productId: new Types.ObjectId(input.productId),
        selectedSize: input.selectedSize ?? null,
        selectedColor: input.selectedColor ?? null,
      },
      {
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          productId: new Types.ObjectId(input.productId),
          selectedSize: input.selectedSize ?? null,
          selectedColor: input.selectedColor ?? null,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async remove(
    userId: string,
    input: { productId: string; selectedSize?: string; selectedColor?: string },
  ): Promise<void> {
    await this.wishlistModel.deleteOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(input.productId),
      selectedSize: input.selectedSize ?? null,
      selectedColor: input.selectedColor ?? null,
    });
  }
}
