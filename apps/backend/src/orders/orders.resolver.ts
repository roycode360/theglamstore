import { Args, Mutation, Query, Resolver, Int } from '@nestjs/graphql';
import { OrderDTO, OrdersService } from './orders.service';
import { isPublic } from 'src/auth/decorators';
import { Order, OrderPage } from './entities/order.entity';

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
  ): Promise<OrderPage> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const res: OrderPageResult = await this.orders.listPage({
      page,
      pageSize,
      status: status ?? null,
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

  @Mutation(() => Boolean)
  async deleteOrder(
    @Args('id', { type: () => String }) id: string,
  ): Promise<boolean> {
    await this.orders.delete(id);
    return true;
  }
}
