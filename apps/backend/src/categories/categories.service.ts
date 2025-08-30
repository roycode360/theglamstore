import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { Category } from './entities/category.entity';
import { CategoryDocument, CategoryModel } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(CategoryModel.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  async list(): Promise<Category[]> {
    const docs = await this.categoryModel
      .find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return docs.map(this.mapDoc);
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const created = await this.categoryModel.create(input);
    return this.mapDoc(created.toObject());
  }

  async update(
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category | undefined> {
    const doc = await this.categoryModel
      .findByIdAndUpdate(id, input, { new: true })
      .lean();
    return doc ? this.mapDoc(doc) : undefined;
  }

  async remove(id: string): Promise<boolean> {
    const res = await this.categoryModel.findByIdAndDelete(id);
    return !!res;
  }

  private mapDoc = (doc: {
    _id: unknown;
    name?: string;
    slug?: string;
    description?: string;
    image?: string;
    sortOrder?: number;
    parentId?: string | null;
    active?: boolean;
  }): Category => ({
    id: String(doc._id),
    name: doc.name ?? '',
    slug: doc.slug ?? '',
    description: doc.description ?? undefined,
    image: doc.image ?? undefined,
    sortOrder: doc.sortOrder ?? 0,
    parentId: doc.parentId ?? undefined,
    active: !!doc.active,
  });
}
