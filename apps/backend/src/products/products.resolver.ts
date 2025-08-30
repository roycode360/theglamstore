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
    @Args('active', { type: () => Boolean, nullable: true }) active?: boolean,
    @Args('outOfStock', { type: () => Boolean, nullable: true })
    outOfStock?: boolean,
    @Args('sortBy', { type: () => String, nullable: true }) sortBy?: string,
    @Args('sortDir', { type: () => String, nullable: true }) sortDir?: string,
  ): Promise<ProductPage> {
    return this.products.listPage(page, pageSize, {
      search,
      category,
      active,
      outOfStock,
      sortBy,
      sortDir,
    });
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
