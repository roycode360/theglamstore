import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductInput } from './dto/create-product.input';
import { Product } from './entities/product.entity';
import { ProductDocument, ProductModel } from './schemas/product.schema';
import { UpdateProductInput } from './dto/update-product.input';

// Narrow type representing the Mongo document shape we read via .lean()
type ProductDocLike = {
  _id: unknown;
  name?: string;
  slug?: string;
  brand?: string;
  category?: string;
  price?: number;
  salePrice?: number | null;
  sku?: string;
  stockQuantity?: number | null;
  description?: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  featured?: boolean;
  active?: boolean;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(ProductModel.name)
    private productModel: Model<ProductDocument>,
  ) {}

  async list(): Promise<Product[]> {
    const docs = await this.productModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(this.mapDocToGraphQL);
  }

  async listPage(
    page: number,
    pageSize: number,
    opts?: {
      search?: string;
      category?: string;
      active?: boolean;
      outOfStock?: boolean;
      sortBy?: string;
      sortDir?: string;
    },
  ) {
    const skip = Math.max(0, (page - 1) * pageSize);
    const filter: Record<string, unknown> & {
      $or?: Record<string, unknown>[];
    } = {};
    if (opts?.search) {
      const rx = new RegExp(opts.search, 'i');
      filter.$or = [{ name: rx }, { brand: rx }, { category: rx }];
    }
    if (opts?.category) {
      const raw = String(opts.category).trim();
      const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = `^${escaped.replace(/[-\s]+/g, '[-\\s]+')}$`;
      filter.category = new RegExp(pattern, 'i');
    }
    if (typeof opts?.active === 'boolean') filter.active = opts.active;
    if (opts?.outOfStock) {
      const existingOr = Array.isArray(filter.$or) ? filter.$or : [];
      filter.$or = [...existingOr, { stockQuantity: { $lte: 0 } }];
    }

    const sort: Record<string, 1 | -1> = {};
    if (opts?.sortBy) sort[opts.sortBy] = opts?.sortDir === 'asc' ? 1 : -1;
    if (!opts?.sortBy) sort.createdAt = -1;

    const [docs, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);
    const items = docs.map(this.mapDocToGraphQL);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { items, total, page, pageSize, totalPages };
  }

  async getById(id: string): Promise<Product | undefined> {
    const doc = await this.productModel.findById(id).lean();
    return doc ? this.mapDocToGraphQL(doc) : undefined;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const created = await this.productModel.create(input);
    const doc = created.toObject();
    return this.mapDocToGraphQL(doc);
  }

  async update(
    id: string,
    input: UpdateProductInput,
  ): Promise<Product | undefined> {
    const doc = await this.productModel
      .findByIdAndUpdate(id, input, { new: true })
      .lean();
    return doc ? this.mapDocToGraphQL(doc) : undefined;
  }

  async remove(id: string): Promise<boolean> {
    const res = await this.productModel.findByIdAndDelete(id);
    return !!res;
  }

  private mapDocToGraphQL = (doc: ProductDocLike): Product => ({
    id: String(doc._id),
    name: doc.name ?? '',
    slug: doc.slug ?? '',
    brand: doc.brand ?? undefined,
    category: doc.category ?? 'others',
    price: doc.price ?? 0,
    salePrice: doc.salePrice ?? null,
    sku: doc.sku ?? undefined,
    stockQuantity: doc.stockQuantity ?? null,
    description: doc.description ?? undefined,
    images: doc.images ?? [],
    sizes: doc.sizes ?? [],
    colors: doc.colors ?? [],
    featured: !!doc.featured,
    active: !!doc.active,
  });
}
