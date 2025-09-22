import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CreateProductInput } from './dto/create-product.input';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductPage } from './entities/product.page';
import { isPublic } from 'src/auth/decorators';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private readonly products: ProductsService) {}

  @isPublic()
  @Query(() => [Product])
  async listProducts(): Promise<Product[]> {
    return this.products.list();
  }

  @isPublic()
  @Query(() => ProductPage)
  async listProductsPage(
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('pageSize', { type: () => Int, nullable: true }) pageSize = 10,
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('category', { type: () => String, nullable: true }) category?: string,
    @Args('brand', { type: () => String, nullable: true }) brand?: string,
    @Args('minPrice', { type: () => Number, nullable: true }) minPrice?: number,
    @Args('maxPrice', { type: () => Number, nullable: true }) maxPrice?: number,
    @Args('active', { type: () => Boolean, nullable: true }) active?: boolean,
    @Args('inStockOnly', { type: () => Boolean, nullable: true })
    inStockOnly?: boolean,
    @Args('onSaleOnly', { type: () => Boolean, nullable: true })
    onSaleOnly?: boolean,
    @Args('outOfStock', { type: () => Boolean, nullable: true })
    outOfStock?: boolean,
    @Args('sortBy', { type: () => String, nullable: true }) sortBy?: string,
    @Args('sortDir', { type: () => String, nullable: true }) sortDir?: string,
  ): Promise<ProductPage> {
    return this.products.listPage(page, pageSize, {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      active,
      inStockOnly,
      onSaleOnly,
      outOfStock,
      sortBy,
      sortDir,
    });
  }

  @isPublic()
  @Query(() => [Product])
  async listFeaturedProducts(): Promise<Product[]> {
    return this.products.listFeatured();
  }

  @isPublic()
  @Query(() => [Product])
  async listProductsByCategory(
    @Args('category', { type: () => String }) category: string,
    @Args('limit', { type: () => Int, nullable: true }) limit = 3,
    @Args('excludeId', { type: () => ID, nullable: true }) excludeId?: string,
  ): Promise<Product[]> {
    return this.products.listByCategory(category, limit, excludeId);
  }

  @isPublic()
  @Query(() => Product, { nullable: true })
  async getProduct(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Product | undefined> {
    return this.products.getById(id);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => Product)
  async createProduct(
    @Args('input') input: CreateProductInput,
  ): Promise<Product> {
    return this.products.create(input);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => Product, { nullable: true })
  async updateProduct(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProductInput,
  ): Promise<Product | undefined> {
    return this.products.update(id, input);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => Boolean)
  async deleteProduct(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.products.remove(id);
  }
}
