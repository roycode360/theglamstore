import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectModel as InjectProductModel } from '@nestjs/mongoose';
import {
  ProductDocument,
  ProductModel,
} from '../products/schemas/product.schema.js';
import { OrderDocument, OrderModel } from './schemas/order.schema.js';
import { EmailService } from '../auth/email.service.js';

export type OrderDTO = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address1: string;
  city: string;
  state: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'bank_transfer';
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  transferProofUrl?: string;
  items: Array<{
    productId: string;
    name?: string;
    price?: number;
    quantity?: number;
    selectedSize?: string;
    selectedColor?: string;
    image?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  // internal flag persisted to prevent double stock deduction
  stockAdjusted?: boolean;
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(OrderModel.name)
    private orderModel: Model<OrderDocument>,
    private readonly email: EmailService,
    @InjectProductModel(ProductModel.name)
    private productModel: Model<ProductDocument>,
  ) {}

  async createBankTransferOrder(
    payload: Partial<OrderModel>,
  ): Promise<OrderDTO> {
    const doc = await this.orderModel.create({
      ...payload,
      paymentMethod: 'bank_transfer',
      status: 'pending',
    });
    const obj = doc.toObject() as unknown as Omit<OrderDTO, '_id'> & {
      _id: unknown;
    };
    const order = { ...obj, _id: String(obj._id) } as OrderDTO;
    // Fire-and-forget: send confirmation email (non-blocking)
    try {
      await this.email.sendOrderConfirmationEmail({
        _id: order._id,
        email: order.email,
        firstName: order.firstName,
        lastName: order.lastName,
        address1: order.address1,
        city: order.city,
        state: order.state,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        paymentMethod: order.paymentMethod,
        transferProofUrl: order.transferProofUrl,
        items: order.items,
      });
    } catch {
      // Intentionally ignore email errors to not block order creation
      // Consider logging in the future
    }
    return order;
  }

  async list(): Promise<OrderDTO[]> {
    type DBOrder = Omit<OrderDTO, '_id'> & { _id: unknown };
    const docs = await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .lean<DBOrder[]>();
    return docs.map((d) => ({ ...d, _id: String(d._id) }));
  }

  async getById(id: string): Promise<OrderDTO | null> {
    type DBOrder = Omit<OrderDTO, '_id'> & { _id: unknown };
    const doc = await this.orderModel.findById(id).lean<DBOrder | null>();
    return doc ? ({ ...doc, _id: String(doc._id) } as OrderDTO) : null;
  }

  async updateStatus(
    id: string,
    status:
      | 'pending'
      | 'confirmed'
      | 'processing'
      | 'shipped'
      | 'delivered'
      | 'cancelled',
  ): Promise<OrderDTO | null> {
    const pre = await this.getById(id);
    await this.orderModel.updateOne({ _id: id }, { $set: { status } });
    const doc = await this.getById(id);
    if (doc && status !== 'pending') {
      switch (status) {
        case 'confirmed': {
          // Deduct stock once when an order gets confirmed
          const alreadyAdjusted = !!pre?.stockAdjusted;
          if (!alreadyAdjusted) {
            const ops = (doc.items || [])
              .filter((it) => it.productId && typeof it.quantity === 'number')
              .map((it) => ({
                updateOne: {
                  filter: { _id: it.productId },
                  update: {
                    $inc: { stockQuantity: -Math.max(0, it.quantity || 0) },
                  },
                },
              }));
            if (ops.length > 0) {
              await this.productModel
                .bulkWrite(ops, { ordered: false })
                .catch(() => undefined);
            }
            await this.orderModel.updateOne(
              { _id: id },
              { $set: { stockAdjusted: true } },
            );
          }
          // continue to send email
          break;
        }
        case 'processing':
        case 'shipped':
        case 'delivered':
        case 'cancelled': {
          // If order is cancelled after confirmation, roll back stock once
          if (status === 'cancelled' && pre?.stockAdjusted) {
            const ops = (doc.items || [])
              .filter((it) => it.productId && typeof it.quantity === 'number')
              .map((it) => ({
                updateOne: {
                  filter: { _id: it.productId },
                  update: {
                    $inc: { stockQuantity: Math.max(0, it.quantity || 0) },
                  },
                },
              }));
            if (ops.length > 0) {
              await this.productModel
                .bulkWrite(ops, { ordered: false })
                .catch(() => undefined);
            }
            await this.orderModel.updateOne(
              { _id: id },
              { $set: { stockAdjusted: false } },
            );
          }
          await this.email.sendOrderStatusEmail({
            order: {
              _id: doc._id,
              email: doc.email,
              firstName: doc.firstName,
              subtotal: doc.subtotal,
              tax: doc.tax,
              total: doc.total,
              paymentMethod: doc.paymentMethod,
              address1: doc.address1,
              city: doc.city,
              state: doc.state,
              items: doc.items,
            },
            status,
          });
          break;
        }
      }
    }
    return doc;
  }

  async delete(id: string) {
    await this.orderModel.deleteOne({ _id: id });
    return true;
  }

  async listPage(params: {
    page: number;
    pageSize: number;
    status?: string | null;
  }): Promise<{
    items: OrderDTO[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page, pageSize, status } = params;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const skip = Math.max(0, (page - 1) * pageSize);
    type DBOrder = Omit<OrderDTO, '_id'> & { _id: unknown };
    const [itemsRaw, total] = await Promise.all([
      this.orderModel.find(filter).skip(skip).limit(pageSize).lean<DBOrder[]>(),
      this.orderModel.countDocuments(filter),
    ]);
    const items: OrderDTO[] = itemsRaw.map((d) => ({
      ...d,
      _id: String(d._id),
    }));
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { items, total, page, pageSize, totalPages };
  }

  async getPendingCount(): Promise<number> {
    const count = await this.orderModel
      .countDocuments({ status: 'pending' })
      .exec();
    return Number(count);
  }
}
