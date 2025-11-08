import { Args, Mutation, Query, Resolver, Int } from '@nestjs/graphql';
import { OrderDTO, OrdersService } from './orders.service';
import { isPublic } from 'src/auth/decorators';
import { Order, OrderPage } from './entities/order.entity';
import { Analytics } from './entities/analytics.entity';
import { RevenueTrend } from './entities/revenue-trend.entity';
import { ProfitCostComparison } from './entities/profit-cost-comparison.entity';
import { TopSellingProducts } from './entities/top-selling-products.entity';
import { DashboardStats } from './entities/dashboard-stats.entity';
import { EditOrderItemsInput } from './dto/edit-order-items.input';
import { CreateAdminOrderInput } from './dto/create-admin-order.input';
import { RecordPaymentInput } from './dto/record-payment.input';
import { UpdateAdminOrderInput } from './dto/update-admin-order.input';

type OrderPageResult = {
  items: OrderDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
//

@Resolver()
export class OrdersResolver {
  constructor(private readonly orders: OrdersService) {}

  @isPublic()
  @Mutation(() => Boolean)
  async createBankTransferOrder(
    @Args('payload', { type: () => String }) payloadJson: string,
  ): Promise<boolean> {
    const parsed: unknown = JSON.parse(payloadJson);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid order payload');
    }
    const payload = parsed as Partial<
      import('./schemas/order.schema').OrderModel
    >;
    await this.orders.createBankTransferOrder(payload);
    return true;
  }

  @isPublic()
  @Query(() => [Order])
  async listOrders(): Promise<Order[]> {
    const docs = await this.orders.list();
    return docs as unknown as Order[];
  }

  @isPublic()
  @Query(() => OrderPage)
  async listOrdersPage(
    @Args('page', { type: () => Int }) page: number,
    @Args('pageSize', { type: () => Int }) pageSize: number,
    @Args('status', { type: () => String, nullable: true }) status?: string,
    @Args('email', { type: () => String, nullable: true }) email?: string,
  ): Promise<OrderPage> {
    const res: OrderPageResult = await this.orders.listPage({
      page,
      pageSize,
      status: status ?? null,
      email: email ?? null,
    });
    return {
      items: res.items as unknown as Order[],
      total: res.total,
      page: res.page,
      pageSize: res.pageSize,
      totalPages: res.totalPages,
    };
  }

  @isPublic()
  @Query(() => Order, { nullable: true })
  async getOrder(
    @Args('id', { type: () => String }) id: string,
  ): Promise<Order | null> {
    const doc = await this.orders.getById(id);
    return doc as unknown as Order | null;
  }

  @Mutation(() => Order, { nullable: true })
  async updateOrderStatus(
    @Args('id', { type: () => String }) id: string,
    @Args('status', { type: () => String })
    status:
      | 'pending'
      | 'confirmed'
      | 'processing'
      | 'shipped'
      | 'delivered'
      | 'cancelled',
  ): Promise<Order | null> {
    const doc = await this.orders.updateStatus(id, status);
    return doc as unknown as Order | null;
  }

  @Mutation(() => Order, { nullable: true })
  async editOrderItems(
    @Args('input', { type: () => EditOrderItemsInput }) input: EditOrderItemsInput,
  ): Promise<Order | null> {
    const updated = await this.orders.editOrderItems(input);
    return updated as unknown as Order | null;
  }

  @Mutation(() => Order)
  async createAdminOrder(
    @Args('input', { type: () => CreateAdminOrderInput })
    input: CreateAdminOrderInput,
  ): Promise<Order> {
    const created = await this.orders.createAdminOrder(input);
    return created as unknown as Order;
  }

  @Mutation(() => Order, { nullable: true })
  async updateAdminOrder(
    @Args('input', { type: () => UpdateAdminOrderInput })
    input: UpdateAdminOrderInput,
  ): Promise<Order | null> {
    const updated = await this.orders.updateAdminOrderDetails(input);
    return updated as unknown as Order | null;
  }

  @Mutation(() => Order, { nullable: true })
  async recordBankTransferPayment(
    @Args('input', { type: () => RecordPaymentInput })
    input: RecordPaymentInput,
  ): Promise<Order | null> {
    const updated = await this.orders.recordBankTransferPayment(input);
    return updated as unknown as Order | null;
  }

  @Mutation(() => Boolean)
  async deleteOrder(
    @Args('id', { type: () => String }) id: string,
  ): Promise<boolean> {
    await this.orders.delete(id);
    return true;
  }

  @isPublic()
  @Query(() => Int)
  async getPendingOrdersCount(): Promise<number> {
    try {
      return await this.orders.getPendingCount();
    } catch (error) {
      console.error('Error getting pending orders count:', error);
      return 0;
    }
  }

  @isPublic()
  @Query(() => Analytics)
  async getAnalytics(): Promise<Analytics> {
    const data = await this.orders.getAnalytics();
    return data as unknown as Analytics;
  }

  @isPublic()
  @Query(() => RevenueTrend)
  async getRevenueTrend(
    @Args('period', { type: () => String, nullable: true })
    period?: string,
  ): Promise<RevenueTrend> {
    const validPeriod =
      period === 'daily' || period === 'weekly' || period === 'monthly'
        ? period
        : 'daily';
    const points = await this.orders.getRevenueTrend(validPeriod);
    return { points } as RevenueTrend;
  }

  @isPublic()
  @Query(() => ProfitCostComparison)
  async getProfitCostComparison(
    @Args('period', { type: () => String, nullable: true })
    period?: string,
  ): Promise<ProfitCostComparison> {
    const validPeriod =
      period === 'daily' || period === 'weekly' || period === 'monthly'
        ? period
        : 'daily';
    const points = await this.orders.getProfitCostComparison(validPeriod);
    return { points } as ProfitCostComparison;
  }

  @isPublic()
  @Query(() => TopSellingProducts)
  async getTopSellingProducts(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<TopSellingProducts> {
    const validLimit = limit && limit > 0 ? Math.min(limit, 100) : 10; // Max 100
    const products = await this.orders.getTopSellingProducts(validLimit);
    return { products } as TopSellingProducts;
  }

  @isPublic()
  @Query(() => DashboardStats)
  async getDashboardStats(): Promise<DashboardStats> {
    const data = await this.orders.getDashboardStats();
    return data as unknown as DashboardStats;
  }
}
