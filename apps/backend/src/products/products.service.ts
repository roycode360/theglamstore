import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductInput } from './dto/create-product.input';
import { Product } from './entities/product.entity';
import { ProductDocument, ProductModel } from './schemas/product.schema';
import { UpdateProductInput } from './dto/update-product.input';
import {
  CategoryDocument,
  CategoryModel,
} from '../categories/schemas/category.schema';

// Narrow type representing the Mongo document shape we read via .lean()
type ProductDocLike = {
  _id: unknown;
  name?: string;
  slug?: string;
  brand?: string;
  category?: string;
  price?: number;
  salePrice?: number | null;
  costPrice?: number | null;
  sku?: string;
  stockQuantity?: number | null;
  description?: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  featured?: boolean;
  active?: boolean;
  reviewCount?: number;
  reviewAverage?: number | null;
};

type CategoryDocLike = {
  _id?: unknown;
  slug?: string;
  name?: string;
  parentId?: string | null;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(ProductModel.name)
    private productModel: Model<ProductDocument>,
    @InjectModel(CategoryModel.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  async list(): Promise<Product[]> {
    const docs = await this.productModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(this.mapDocToGraphQL);
  }

  async listFeatured(): Promise<Product[]> {
    const docs = await this.productModel
      .find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(24)
      .lean();

    return docs.map(this.mapDocToGraphQL);
  }

  async listByCategory(
    category: string,
    limit: number = 3,
    excludeId?: string,
  ): Promise<Product[]> {
    const raw = String(category).trim();
    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Replace any run of whitespace/dashes with a character-class pattern "[\s-]+"
    const pattern = `^${escaped.replace(new RegExp('[\\s-]+', 'g'), '[\\s-]+')}$`;
    const filter: Record<string, any> = {
      category: new RegExp(pattern, 'i'),
      active: { $ne: false },
    };
    if (excludeId) filter._id = { $ne: excludeId };
    const docs = await this.productModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.max(1, limit))
      .lean();
    return docs.map(this.mapDocToGraphQL);
  }

  async listPage(
    page: number,
    pageSize: number,
    opts?: {
      search?: string;
      category?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
      active?: boolean;
      inStockOnly?: boolean;
      onSaleOnly?: boolean;
      outOfStock?: boolean;
      sortBy?: string;
      sortDir?: string;
    },
  ) {
    const skip = Math.max(0, (page - 1) * pageSize);
    const conditions: Record<string, any>[] = [];

    if (opts?.search) {
      const rx = new RegExp(opts.search, 'i');
      conditions.push({ $or: [{ name: rx }, { brand: rx }, { category: rx }] });
    }

    if (typeof opts?.category === 'string' && opts.category.trim()) {
      const rawSlug = String(opts.category).trim();
      const { matched, descendants } = await this.resolveCategoryScope(rawSlug);

      const docsToMatch: CategoryDocLike[] = [];
      if (matched) docsToMatch.push(matched);
      docsToMatch.push(...descendants);
      if (!docsToMatch.length) {
        docsToMatch.push({ slug: rawSlug });
      }

      const matchValues = new Set<string>();
      for (const doc of docsToMatch) {
        if (doc.slug) matchValues.add(doc.slug);
        if (doc.name) matchValues.add(doc.name);
      }
      matchValues.add(rawSlug);

      const regexMap = new Map<string, RegExp>();
      for (const value of matchValues) {
        const flexible = this.buildFlexibleRegex(value);
        if (flexible) regexMap.set(flexible.source + flexible.flags, flexible);
        const nested = this.buildCategoryMatcher(value);
        if (nested) regexMap.set(nested.source + nested.flags, nested);
      }

      const categoryExpressions = Array.from(regexMap.values());
      if (categoryExpressions.length === 1) {
        conditions.push({ category: categoryExpressions[0] });
      } else if (categoryExpressions.length > 1) {
        conditions.push({
          $or: categoryExpressions.map((regex) => ({ category: regex })),
        });
      }
    }

    if (typeof opts?.brand === 'string' && opts.brand.trim()) {
      const brandRegex = this.buildFlexibleRegex(opts.brand);
      if (brandRegex) {
        conditions.push({ brand: brandRegex });
      }
    }

    if (
      typeof opts?.minPrice === 'number' ||
      typeof opts?.maxPrice === 'number'
    ) {
      const priceClauses: Record<string, any>[] = [];
      const saleRange: Record<string, number> = {};
      const priceRange: Record<string, number> = {};

      if (typeof opts?.minPrice === 'number') {
        saleRange.$gte = opts.minPrice;
        priceRange.$gte = opts.minPrice;
      }
      if (typeof opts?.maxPrice === 'number') {
        saleRange.$lte = opts.maxPrice;
        priceRange.$lte = opts.maxPrice;
      }

      priceClauses.push({ salePrice: { $ne: null, ...saleRange } });
      priceClauses.push({ price: { ...priceRange } });
      conditions.push({ $or: priceClauses });
    }

    if (typeof opts?.active === 'boolean') {
      conditions.push({ active: opts.active });
    }

    if (opts?.inStockOnly) {
      conditions.push({ stockQuantity: { $gt: 0 } });
    } else if (opts?.outOfStock) {
      conditions.push({ stockQuantity: { $lte: 0 } });
    }

    if (opts?.onSaleOnly) {
      conditions.push({ salePrice: { $ne: null } });
    }

    const filter =
      conditions.length === 0
        ? {}
        : conditions.length === 1
          ? conditions[0]
          : { $and: conditions };

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

  private async resolveCategoryScope(slug: string): Promise<{
    matched: CategoryDocLike | null;
    descendants: CategoryDocLike[];
  }> {
    let matched = await this.categoryModel
      .findOne({ slug })
      .lean<CategoryDocLike | null>();

    if (!matched) {
      const fallbackRegex = this.buildFlexibleRegex(slug);
      if (fallbackRegex) {
        matched = await this.categoryModel
          .findOne({ slug: fallbackRegex })
          .lean<CategoryDocLike | null>();
      }
    }

    if (!matched) {
      return { matched: null, descendants: [] };
    }

    const descendants: CategoryDocLike[] = [];
    const queue: string[] = [];
    const visited = new Set<string>();

    const matchedId = this.stringifyId(matched._id);
    if (matchedId) {
      visited.add(matchedId);
      queue.push(matchedId);
    }

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;
      const children = await this.categoryModel
        .find({ parentId: currentId })
        .lean<Array<CategoryDocLike>>();
      for (const child of children) {
        const childId = this.stringifyId(child._id);
        if (childId && visited.has(childId)) {
          continue;
        }
        descendants.push(child);
        if (childId) {
          visited.add(childId);
          queue.push(childId);
        }
      }
    }

    return { matched, descendants };
  }

  private buildFlexibleRegex(value: string): RegExp | null {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return null;
    const tokens = trimmed
      .split(/[\s/_-]+/)
      .filter(Boolean)
      .map((token) => token.replace(/[.*+?^${}|()[\]\\]/g, '\\$&'));
    if (!tokens.length) return null;
    const body = tokens.join('[\\s/_-]+');
    return new RegExp(`^${body}$`, 'i');
  }

  private buildCategoryMatcher(value: string): RegExp | null {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return null;
    const tokens = trimmed
      .split(/[\s>/_-]+/)
      .filter(Boolean)
      .map((token) => token.replace(/[.*+?^${}|()[\]\\]/g, '\\$&'));
    if (!tokens.length) return null;
    const body = tokens.join('[\\s>/_-]+');
    return new RegExp(`(?:^|[\\s>/_-])${body}(?:$|[\\s>/_-])`, 'i');
  }

  private stringifyId(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === 'string') return value;
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { toString?: () => string }).toString === 'function'
    ) {
      const out = (value as { toString: () => string }).toString();
      return out === '[object Object]' ? null : out;
    }
    return null;
  }

  private mapDocToGraphQL = (doc: ProductDocLike): Product => ({
    _id: String(doc._id),
    name: doc.name ?? '',
    slug: doc.slug ?? '',
    brand: doc.brand ?? undefined,
    category: doc.category ?? 'others',
    price: doc.price ?? 0,
    salePrice: doc.salePrice ?? null,
    costPrice: doc.costPrice ?? null,
    sku: doc.sku ?? undefined,
    stockQuantity: doc.stockQuantity ?? null,
    description: doc.description ?? undefined,
    images: doc.images ?? [],
    sizes: doc.sizes ?? [],
    colors: doc.colors ?? [],
    featured: !!doc.featured,
    active: !!doc.active,
    reviewCount: doc.reviewCount ?? 0,
    reviewAverage:
      typeof doc.reviewAverage === 'number' ? doc.reviewAverage : null,
  });
}
