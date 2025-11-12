import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { InjectModel as InjectProductModel } from '@nestjs/mongoose';
import { CouponsService } from '../coupons/coupons.service.js';
import {
  ProductDocument,
  ProductModel,
} from '../products/schemas/product.schema.js';
import { OrderDocument, OrderModel } from './schemas/order.schema.js';
import {
  DeliveryLocationDocument,
  DeliveryLocationModel,
} from '../delivery-locations/schemas/delivery-location.schema.js';
import { EmailService } from '../auth/email.service.js';
import { EditOrderItemsInput, EditOp } from './dto/edit-order-items.input.js';
import { CreateAdminOrderInput } from './dto/create-admin-order.input.js';
import { RecordPaymentInput } from './dto/record-payment.input.js';
import { UpdateAdminOrderInput } from './dto/update-admin-order.input.js';
import type { BulkWriteResult } from 'mongodb';
import { customAlphabet } from 'nanoid';

export type OrderDTO = {
  _id: string;
  orderNumber?: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address1: string;
  city: string;
  state: string;
  subtotal: number;
  total: number;
  deliveryFee?: number;
  paymentMethod: 'bank_transfer';
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'awaiting_additional_payment';
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
  // coupon fields
  couponCode?: string;
  couponDiscount?: number;
  couponUsageCounted?: boolean;
  // payments and source
  amountPaid?: number;
  amountRefunded?: number;
  balanceDue?: number;
  source?: 'customer' | 'admin';
  paymentReference?: string | null;
  notes?: string | null;
  auditLog?: Array<{
    at: Date;
    actorId?: string;
    actorRole?: string;
    type?: string;
    payload?: Record<string, any>;
  }>;
};

@Injectable()
export class OrdersService {
  private readonly orderSuffix = customAlphabet(
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    4,
  );

  constructor(
    @InjectModel(OrderModel.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(DeliveryLocationModel.name)
    private deliveryLocationModel: Model<DeliveryLocationDocument>,
    private readonly email: EmailService,
    @InjectProductModel(ProductModel.name)
    private productModel: Model<ProductDocument>,
    private readonly coupons: CouponsService,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const dateSegment = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `TGS-${dateSegment}-${this.orderSuffix()}`;
      const exists = await this.orderModel.exists({ orderNumber: candidate });
      if (!exists) {
        return candidate;
      }
    }

    return `TGS-${Date.now()}`;
  }

  async createBankTransferOrder(
    payload: Partial<OrderModel>,
  ): Promise<OrderDTO> {
    const orderNumber = await this.generateOrderNumber();

    let deliveryFee = Number(payload.deliveryFee ?? 0) || 0;
    let deliveryLocationId: string | null =
      (payload.deliveryLocationId as string | undefined) ?? null;
    let deliveryLocationName: string | null =
      (payload.deliveryLocationName as string | undefined) ?? null;

    // If deliveryLocationId is provided, prefer it to compute fees and names
    if (deliveryLocationId) {
      const loc = await this.deliveryLocationModel
        .findById(deliveryLocationId)
        .lean<{ _id: unknown; name?: string; price?: number; active?: boolean } | null>();
      if (loc && (loc.active ?? true)) {
        deliveryFee = Number(loc.price ?? 0) || 0;
        deliveryLocationName = loc.name ?? deliveryLocationName;
      }
    }

    const doc = await this.orderModel.create({
      ...payload,
      orderNumber,
      paymentMethod: 'bank_transfer',
      status: 'pending',
      amountPaid: payload.amountPaid ?? 0,
      amountRefunded: payload.amountRefunded ?? 0,
      balanceDue:
        typeof payload.total === 'number'
          ? Math.max(
              0,
              (payload.total || 0) -
                (payload.amountPaid || 0) +
                (payload.amountRefunded || 0),
            )
          : 0,
      source: payload.source ?? 'customer',
      deliveryFee,
      deliveryLocationId,
      deliveryLocationName,
      paymentReference: payload.paymentReference ?? null,
      notes: payload.notes ?? null,
    });
    const obj = doc.toObject() as unknown as Omit<OrderDTO, '_id'> & {
      _id: unknown;
    };
    const order = { ...obj, _id: String(obj._id) } as OrderDTO;
    return order;
  }

  private async recalcTotals(
    order: OrderDTO & { items: NonNullable<OrderDTO['items']> },
  ) {
    const subtotal = (order.items || []).reduce((sum, it) => {
      const line = (it.price || 0) * (it.quantity || 0);
      return sum + (isFinite(line) ? line : 0);
    }, 0);

    let couponCode = order.couponCode;
    let discount = order.couponDiscount || 0;

    if (couponCode) {
      const validation = await this.coupons.validateCoupon({
        code: couponCode,
        orderAmount: subtotal,
      });
      if (!validation.valid) {
        couponCode = undefined;
        discount = 0;
      } else {
        discount = validation.discountAmount ?? 0;
        couponCode = validation.coupon?.code ?? couponCode;
      }
    }

    const deliveryFee = Number(order.deliveryFee ?? 0);
    const total = Math.max(
      0,
      subtotal -
        (isFinite(discount) ? discount : 0) +
        (isFinite(deliveryFee) ? deliveryFee : 0),
    );
    const amountPaid = order.amountPaid || 0;
    const amountRefunded = order.amountRefunded || 0;
    const balanceDue = Math.max(0, total - amountPaid + amountRefunded);
    return {
      subtotal,
      total,
      balanceDue,
      couponCode,
      couponDiscount: discount,
      deliveryFee,
    };
  }

  async editOrderItems(input: EditOrderItemsInput): Promise<OrderDTO | null> {
    const order = await this.getById(input.orderId);
    if (!order) return null;
    const items = Array.isArray(order.items) ? [...order.items] : [];

    for (const op of input.operations) {
      if (op.op === EditOp.ADD) {
        items.push({
          productId: op.productId,
          name: op.name,
          price: op.price ?? 0,
          quantity: op.quantity ?? 1,
          selectedSize: op.selectedSize,
          selectedColor: op.selectedColor,
          image: op.image,
        });
      } else if (op.op === EditOp.REMOVE) {
        const idx = items.findIndex(
          (it) =>
            it.productId === op.productId &&
            (op.selectedSize ? it.selectedSize === op.selectedSize : true) &&
            (op.selectedColor ? it.selectedColor === op.selectedColor : true),
        );
        if (idx >= 0) items.splice(idx, 1);
      } else if (op.op === EditOp.UPDATE) {
        const idx = items.findIndex(
          (it) =>
            it.productId === op.productId &&
            (op.selectedSize ? it.selectedSize === op.selectedSize : true) &&
            (op.selectedColor ? it.selectedColor === op.selectedColor : true),
        );
        if (idx >= 0) {
          items[idx] = {
            ...items[idx],
            price: op.price ?? items[idx].price,
            quantity: op.quantity ?? items[idx].quantity,
            selectedSize: op.selectedSize ?? items[idx].selectedSize,
            selectedColor: op.selectedColor ?? items[idx].selectedColor,
            image: op.image ?? items[idx].image,
          };
        }
      }
    }

    // Validate stock availability for updated quantities
    const prevQuantityMap = new Map<string, number>();
    (order.items || []).forEach((it) => {
      const qty = Math.max(0, it.quantity || 0);
      prevQuantityMap.set(
        it.productId,
        (prevQuantityMap.get(it.productId) || 0) + qty,
      );
    });
    const nextQuantityMap = new Map<string, number>();
    items.forEach((it) => {
      const qty = Math.max(0, it.quantity || 0);
      nextQuantityMap.set(
        it.productId,
        (nextQuantityMap.get(it.productId) || 0) + qty,
      );
    });

    const productIds = Array.from(
      new Set([...nextQuantityMap.keys(), ...prevQuantityMap.keys()]),
    );

    const productMap = new Map<
      string,
      { name?: string; stockQuantity: number }
    >();

    if (productIds.length > 0) {
      const productDocs = await this.productModel
        .find({ _id: { $in: productIds } })
        .select('_id name stockQuantity')
        .lean<
          Array<{ _id: unknown; name?: string; stockQuantity?: number | null }>
        >();

      for (const doc of productDocs) {
        productMap.set(String(doc._id), {
          name: doc.name,
          stockQuantity:
            typeof doc.stockQuantity === 'number'
              ? doc.stockQuantity
              : Number.POSITIVE_INFINITY,
        });
      }

      const alreadyAdjusted = !!order.stockAdjusted;
      for (const productId of productIds) {
        const product = productMap.get(productId);
        if (!product) {
          throw new Error('Product unavailable for order');
        }
        const prevQty = prevQuantityMap.get(productId) || 0;
        const nextQty = nextQuantityMap.get(productId) || 0;
        const available = alreadyAdjusted
          ? (product.stockQuantity ?? 0) + prevQty
          : (product.stockQuantity ?? 0);
        if (nextQty > available) {
          throw new Error(
            `Insufficient stock for product ${product.name || productId}`,
          );
        }
      }
    }

    const stockAdjustments: Array<{
      updateOne: {
        filter: { _id: string };
        update: { $inc: { stockQuantity: number } };
      };
    }> = [];

    if (order.stockAdjusted && productIds.length > 0) {
      for (const productId of productIds) {
        const product = productMap.get(productId);
        if (!product) continue;
        const prevQty = prevQuantityMap.get(productId) || 0;
        const nextQty = nextQuantityMap.get(productId) || 0;
        const diff = nextQty - prevQty;
        if (diff === 0) continue;
        if (diff > 0) {
          stockAdjustments.push({
            updateOne: {
              filter: { _id: productId },
              update: { $inc: { stockQuantity: -diff } },
            },
          });
        } else {
          stockAdjustments.push({
            updateOne: {
              filter: { _id: productId },
              update: { $inc: { stockQuantity: Math.abs(diff) } },
            },
          });
        }
      }
    }

    const merged: OrderDTO = { ...order, items };
    const totals = await this.recalcTotals({
      ...merged,
      items,
    });
    const nextStatus =
      totals.balanceDue > 0 ? 'awaiting_additional_payment' : order.status;

    await this.orderModel.updateOne(
      { _id: order._id },
      {
        $set: {
          items,
          couponDiscount: totals.couponDiscount,
          couponCode: totals.couponCode,
          subtotal: totals.subtotal,
          total: totals.total,
          balanceDue: totals.balanceDue,
          deliveryFee: totals.deliveryFee,
          status: nextStatus,
        },
        $push: {
          auditLog: {
            at: new Date(),
            type: 'ORDER_ITEMS_EDITED',
            payload: { operations: input.operations, note: input.note },
          },
        },
      },
    );

    if (stockAdjustments.length > 0) {
      await this.productModel
        .bulkWrite(stockAdjustments, { ordered: false })
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Unable to adjust stock';
          throw new Error(
            message || 'Unable to adjust stock for edited order items',
          );
        });
    }

    const updated = await this.getById(order._id);
    return updated;
  }

  async createAdminOrder(input: CreateAdminOrderInput): Promise<OrderDTO> {
    const items = (input.items || []).map((it) => ({
      productId: it.productId,
      name: it.name,
      price: it.price ?? 0,
      quantity: it.quantity ?? 1,
      selectedSize: it.selectedSize,
      selectedColor: it.selectedColor,
      image: it.image,
    }));
    let deliveryFee =
      input.deliveryFee != null ? Number(input.deliveryFee) : 0;
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      deliveryFee = 0;
    }
    let deliveryLocationId =
      typeof input.deliveryLocationId === 'string'
        ? input.deliveryLocationId
        : null;
    let deliveryLocationName =
      typeof input.deliveryLocationName === 'string'
        ? input.deliveryLocationName
        : null;

    if (deliveryLocationId) {
      const deliveryLocation = await this.deliveryLocationModel
        .findById(deliveryLocationId)
        .lean<{
          _id: unknown;
          name?: string;
          price?: number;
          active?: boolean;
        } | null>();
      if (deliveryLocation && (deliveryLocation.active ?? true)) {
        deliveryFee = Number(deliveryLocation.price ?? 0) || 0;
        deliveryLocationName =
          deliveryLocation.name ?? deliveryLocationName ?? null;
        deliveryLocationId = String(deliveryLocation._id);
      } else {
        deliveryLocationId = null;
        deliveryLocationName = null;
      }
    }

    const amountPaid = input.amountPaid || 0;
    const amountRefunded = 0;

    const quantityByProduct = new Map<string, number>();
    for (const item of items) {
      const qty = Math.max(0, item.quantity ?? 0);
      if (qty === 0) continue;
      quantityByProduct.set(
        item.productId,
        (quantityByProduct.get(item.productId) || 0) + qty,
      );
    }

    let initialStatus: OrderModel['status'] | null = null;

    const executeCreate = async (
      session: ClientSession | null,
    ): Promise<string> => {
      if (quantityByProduct.size > 0) {
        const productDocs = await this.productModel
          .find({ _id: { $in: Array.from(quantityByProduct.keys()) } })
          .select('_id name stockQuantity')
          .session(session ?? null)
          .lean<
            Array<{
              _id: unknown;
              name?: string;
              stockQuantity?: number | null;
            }>
          >();
        const productMap = new Map<
          string,
          { stockQuantity: number; name?: string }
        >();
        for (const product of productDocs) {
          productMap.set(String(product._id), {
            stockQuantity:
              typeof product.stockQuantity === 'number'
                ? product.stockQuantity
                : Number.POSITIVE_INFINITY,
            name: product.name,
          });
        }
        for (const [productId, qty] of quantityByProduct.entries()) {
          const product = productMap.get(productId);
          if (!product) {
            throw new Error('Product unavailable for order');
          }
          if (product.stockQuantity < qty) {
            throw new Error(
              `Insufficient stock for product ${product.name || productId}`,
            );
          }
        }
      }

      const now = new Date();
      const totals = await this.recalcTotals({
        _id: 'temp',
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        address1: input.address1,
        city: input.city,
        state: input.state,
        subtotal: 0,
        total: 0,
        deliveryFee,
        paymentMethod: 'bank_transfer',
        status: 'pending',
        items,
        amountPaid,
        amountRefunded,
        balanceDue: 0,
        source: 'admin',
        couponCode:
          input.couponCode && input.couponCode.trim().length > 0
            ? input.couponCode.trim().toUpperCase()
            : undefined,
        couponDiscount: input.couponDiscount || 0,
        transferProofUrl: input.transferProofUrl,
      } as OrderDTO & { items: NonNullable<OrderDTO['items']> });

      initialStatus =
        totals.balanceDue > 0 ? 'awaiting_additional_payment' : 'confirmed';

      const sanitizeOptionalString = (value: unknown): string | null => {
        if (typeof value !== 'string') return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const paymentReferenceValue = sanitizeOptionalString(
        (input as { paymentReference?: unknown }).paymentReference,
      );
      const notesValue = sanitizeOptionalString(
        (input as { notes?: unknown }).notes,
      );
      const deliveryLocationNameValue = sanitizeOptionalString(
        deliveryLocationName,
      );
      const deliveryLocationIdValue =
        typeof deliveryLocationId === 'string' &&
        deliveryLocationId.trim().length > 0
          ? deliveryLocationId.trim()
          : null;

      const orderPayload = {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        address1: input.address1,
        city: input.city,
        state: input.state,
        subtotal: totals.subtotal,
        total: totals.total,
        couponCode: totals.couponCode,
        couponDiscount: totals.couponDiscount,
        paymentMethod: 'bank_transfer',
        status: initialStatus,
        transferProofUrl: input.transferProofUrl,
        items,
        amountPaid,
        amountRefunded,
        balanceDue: totals.balanceDue,
        deliveryFee: totals.deliveryFee,
        deliveryLocationId: deliveryLocationIdValue,
        deliveryLocationName: deliveryLocationNameValue,
        source: 'admin',
        stockAdjusted: quantityByProduct.size > 0,
        paymentReference: paymentReferenceValue,
        notes: notesValue,
        auditLog: [
          {
            at: now,
            type: 'ORDER_CREATED_ADMIN',
            payload: { amountPaid, balanceDue: totals.balanceDue },
          },
        ],
      };

      let createdDoc: OrderDocument;
      if (session) {
        const created = await this.orderModel.create([orderPayload], {
          session,
        });
        createdDoc = created[0];
      } else {
        createdDoc = await this.orderModel.create(orderPayload);
      }
      const createdIdLocal = String(createdDoc._id);

      if (quantityByProduct.size > 0) {
        const bulkOps = Array.from(quantityByProduct.entries()).map(
          ([productId, qty]) => ({
            updateOne: {
              filter: { _id: productId },
              update: { $inc: { stockQuantity: -qty } },
            },
          }),
        );
        const bulkOptions = session
          ? { session, ordered: false as const }
          : ({ ordered: false } as const);
        const bulkResult = await this.productModel.bulkWrite(
          bulkOps,
          bulkOptions,
        );
        if ((bulkResult as BulkWriteResult).matchedCount !== bulkOps.length) {
          throw new Error('Unable to adjust stock for all items');
        }
      }

      return createdIdLocal;
    };

    const session = await this.orderModel.db.startSession();
    let createdId: string | null = null;
    try {
      try {
        await session.withTransaction(async () => {
          createdId = await executeCreate(session);
        });
      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          (error as { code?: number }).code === 20
        ) {
          createdId = await executeCreate(null);
        } else {
          throw error;
        }
      }
    } finally {
      await session.endSession();
    }

    if (!createdId) {
      throw new Error('Unable to create admin order');
    }

    const created = (await this.getById(createdId))!;
    // If fully paid, trigger stock deduction via status change to confirmed
    if (initialStatus === 'confirmed') {
      await this.updateStatus(created._id, 'confirmed');
      return (await this.getById(created._id))!;
    }
    return created;
  }

  async recordBankTransferPayment(
    input: RecordPaymentInput,
  ): Promise<OrderDTO | null> {
    const order = await this.getById(input.orderId);
    if (!order) return null;
    const amount = Math.max(0, Number(input.amount || 0));
    if (amount <= 0) {
      return order; // no-op
    }

    const nextAmountPaid = (order.amountPaid || 0) + amount;
    const merged: OrderDTO = {
      ...order,
      amountPaid: nextAmountPaid,
    };
    const totals = await this.recalcTotals({
      ...merged,
      items: merged.items,
    });

    await this.orderModel.updateOne(
      { _id: order._id },
      {
        $set: {
          amountPaid: nextAmountPaid,
          subtotal: totals.subtotal,
          total: totals.total,
          balanceDue: totals.balanceDue,
          ...(input.transferProofUrl
            ? { transferProofUrl: input.transferProofUrl }
            : {}),
          ...(totals.balanceDue > 0
            ? { status: 'awaiting_additional_payment' }
            : {}),
        },
        $push: {
          auditLog: {
            at: new Date(),
            type: 'PAYMENT_RECORDED',
            payload: {
              amount,
              note: input.note,
              proof: input.transferProofUrl,
            },
          },
        },
      },
    );

    // If fully paid, transition to confirmed to trigger stock deduction + emails + coupon usage
    let updated = await this.getById(order._id);
    if (
      updated &&
      (updated.balanceDue || 0) <= 0 &&
      updated.status !== 'confirmed'
    ) {
      await this.updateStatus(order._id, 'confirmed');
      updated = await this.getById(order._id);
    }
    return updated;
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
    if (!doc) return null;

    let orderNumber = doc.orderNumber;
    if (!orderNumber) {
      orderNumber = await this.generateOrderNumber();
      await this.orderModel.updateOne({ _id: id }, { $set: { orderNumber } });
    }

    return { ...doc, orderNumber, _id: String(doc._id) } as OrderDTO;
  }

  async findCustomerOrderForProduct(params: {
    email: string;
    productId: string;
    orderId?: string | null;
    orderNumber?: string | null;
  }): Promise<OrderDTO | null> {
    const eligibleStatuses: OrderDTO['status'][] = [
      'confirmed',
      'processing',
      'shipped',
      'delivered',
    ];

    const query: Record<string, unknown> = {
      email: params.email,
      status: { $in: eligibleStatuses },
      'items.productId': params.productId,
    };

    if (params.orderNumber) {
      query.orderNumber = params.orderNumber;
    }

    if (params.orderId && Types.ObjectId.isValid(params.orderId)) {
      query._id = new Types.ObjectId(params.orderId);
    }

    type DBOrder = Omit<OrderDTO, '_id'> & { _id: unknown };
    const doc = await this.orderModel
      .findOne(query)
      .sort({ createdAt: -1 })
      .lean<DBOrder | null>();

    if (!doc) {
      return null;
    }

    return this.getById(String(doc._id));
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
          // Send order confirmation email when order is confirmed
          try {
            await this.email.sendOrderConfirmationEmail({
              _id: doc._id,
              email: doc.email,
              firstName: doc.firstName,
              lastName: doc.lastName,
              address1: doc.address1,
              city: doc.city,
              state: doc.state,
              subtotal: doc.subtotal,
              total: doc.total,
              paymentMethod: doc.paymentMethod,
              transferProofUrl: doc.transferProofUrl,
              items: doc.items,
            });
          } catch {
            // Intentionally ignore email errors to not block order status update
            // Consider logging in the future
          }
          // Increment coupon usage once when order is confirmed
          if (doc.couponCode && !pre?.couponUsageCounted) {
            try {
              await this.coupons.incrementUsage(String(doc.couponCode));
              await this.orderModel.updateOne(
                { _id: id },
                { $set: { couponUsageCounted: true } },
              );
            } catch {
              // Intentionally ignore coupon increment errors to not block order status update
            }
          }
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
    email?: string | null;
  }): Promise<{
    items: OrderDTO[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page, pageSize, status, email } = params;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (email) filter.email = email;
    const skip = Math.max(0, (page - 1) * pageSize);
    type DBOrder = Omit<OrderDTO, '_id'> & { _id: unknown };
    const [itemsRaw, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean<DBOrder[]>(),
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

  async getAnalytics(): Promise<{
    totalRevenue: number;
    totalProfit: number;
    totalCostPrice: number;
    totalSellingPrice: number;
    inventoryValue: number;
    numberOfCustomers: number;
    numberOfReturningCustomers: number;
    numberOfCompletedOrders: number;
    totalProductsSold: number;
  }> {
    // Get all delivered orders
    const deliveredOrders = await this.orderModel
      .find({ status: 'delivered' })
      .lean<Array<OrderDTO & { _id: unknown }>>();

    // Collect all unique product IDs
    const productIds = new Set<string>();
    for (const order of deliveredOrders) {
      for (const item of order.items || []) {
        if (item.productId) productIds.add(item.productId);
      }
    }

    // Batch fetch all products with explicit field selection
    const products = await this.productModel
      .find({ _id: { $in: Array.from(productIds) } })
      .select('_id costPrice price salePrice')
      .lean<
        Array<{
          _id: unknown;
          costPrice?: number | null;
          price?: number;
          salePrice?: number | null;
        }>
      >();

    // Create a map for quick product lookup
    const productMap = new Map<
      string,
      { costPrice: number; sellingPrice: number }
    >();
    for (const product of products) {
      const id = String(product._id);
      // Use nullish coalescing to handle null/undefined, but keep 0 if explicitly set
      // If costPrice is not set, it will be undefined and default to 0
      const costPrice = product.costPrice ?? 0;
      const sellingPrice = product.salePrice ?? product.price ?? 0;
      productMap.set(id, { costPrice, sellingPrice });
    }

    // Calculate metrics
    let totalRevenue = 0;
    let totalCostPrice = 0;
    let totalSellingPrice = 0;
    let totalProductsSold = 0;
    const customerEmails = new Set<string>();
    const customerOrderCounts = new Map<string, number>();

    // Process each delivered order
    for (const order of deliveredOrders) {
      totalRevenue += order.total || 0;

      // Process order items
      for (const item of order.items || []) {
        if (!item.productId || !item.quantity) continue;

        const product = productMap.get(item.productId);
        if (product) {
          const quantity = item.quantity || 0;
          totalCostPrice += product.costPrice * quantity;
          totalSellingPrice += product.sellingPrice * quantity;
          totalProductsSold += quantity;
        }
      }

      // Track customers
      if (order.email) {
        customerEmails.add(order.email);
        customerOrderCounts.set(
          order.email,
          (customerOrderCounts.get(order.email) || 0) + 1,
        );
      }
    }

    // Calculate returning customers (customers with more than 1 order)
    const numberOfReturningCustomers = Array.from(
      customerOrderCounts.values(),
    ).filter((count) => count > 1).length;

    // Calculate inventory value (cost of unsold inventory)
    const inventoryProducts = await this.productModel
      .find({ stockQuantity: { $gt: 0 } })
      .select('costPrice stockQuantity')
      .lean<
        Array<{ costPrice?: number | null; stockQuantity?: number | null }>
      >();

    const inventoryValue = inventoryProducts.reduce((sum, product) => {
      const costPrice = product.costPrice ?? 0;
      const stockQuantity = product.stockQuantity ?? 0;
      return sum + costPrice * stockQuantity;
    }, 0);

    return {
      totalRevenue,
      totalProfit: totalRevenue - totalCostPrice,
      totalCostPrice,
      totalSellingPrice,
      inventoryValue,
      numberOfCustomers: customerEmails.size,
      numberOfReturningCustomers,
      numberOfCompletedOrders: deliveredOrders.length,
      totalProductsSold,
    };
  }

  async getRevenueTrend(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<Array<{ date: string; revenue: number }>> {
    // Get all delivered orders
    const deliveredOrders = await this.orderModel
      .find({ status: 'delivered' })
      .sort({ createdAt: 1 })
      .lean<Array<OrderDTO & { _id: unknown; createdAt: Date }>>();

    // Group orders by period
    const revenueMap = new Map<string, number>();

    for (const order of deliveredOrders) {
      const orderDate = new Date(order.createdAt);
      let periodKey: string;

      switch (period) {
        case 'daily': {
          // Format: YYYY-MM-DD
          periodKey = orderDate.toISOString().split('T')[0];
          break;
        }
        case 'weekly': {
          // Get the start of the week (Monday)
          const weekStart = new Date(orderDate);
          const day = weekStart.getDay();
          const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday (0 = Sunday, 1 = Monday)
          weekStart.setDate(weekStart.getDate() + diff);
          weekStart.setHours(0, 0, 0, 0);
          // Format: YYYY-MM-DD (start of week)
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'monthly': {
          // Format: YYYY-MM
          periodKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        }
        default:
          periodKey = orderDate.toISOString().split('T')[0];
      }

      const currentRevenue = revenueMap.get(periodKey) || 0;
      revenueMap.set(periodKey, currentRevenue + (order.total || 0));
    }

    // Convert map to array and sort by date
    const points = Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return points;
  }

  async getProfitCostComparison(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<Array<{ date: string; profit: number; cost: number }>> {
    // Get all delivered orders
    const deliveredOrders = await this.orderModel
      .find({ status: 'delivered' })
      .sort({ createdAt: 1 })
      .lean<Array<OrderDTO & { _id: unknown; createdAt: Date }>>();

    // Collect all unique product IDs
    const productIds = new Set<string>();
    for (const order of deliveredOrders) {
      for (const item of order.items || []) {
        if (item.productId) productIds.add(item.productId);
      }
    }

    // Batch fetch all products with explicit field selection
    const products = await this.productModel
      .find({ _id: { $in: Array.from(productIds) } })
      .select('_id costPrice price salePrice')
      .lean<
        Array<{
          _id: unknown;
          costPrice?: number | null;
          price?: number;
          salePrice?: number | null;
        }>
      >();

    // Create a map for quick product lookup
    const productMap = new Map<
      string,
      { costPrice: number; sellingPrice: number }
    >();
    for (const product of products) {
      const id = String(product._id);
      // Use nullish coalescing to handle null/undefined, but keep 0 if explicitly set
      // If costPrice is not set, it will be undefined and default to 0
      const costPrice = product.costPrice ?? 0;
      const sellingPrice = product.salePrice ?? product.price ?? 0;
      productMap.set(id, { costPrice, sellingPrice });
    }

    // Group orders by period and calculate profit/cost
    const periodMap = new Map<string, { revenue: number; cost: number }>();

    for (const order of deliveredOrders) {
      const orderDate = new Date(order.createdAt);
      let periodKey: string;

      switch (period) {
        case 'daily': {
          // Format: YYYY-MM-DD
          periodKey = orderDate.toISOString().split('T')[0];
          break;
        }
        case 'weekly': {
          // Get the start of the week (Monday)
          const weekStart = new Date(orderDate);
          const day = weekStart.getDay();
          const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday (0 = Sunday, 1 = Monday)
          weekStart.setDate(weekStart.getDate() + diff);
          weekStart.setHours(0, 0, 0, 0);
          // Format: YYYY-MM-DD (start of week)
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'monthly': {
          // Format: YYYY-MM
          periodKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        }
        default:
          periodKey = orderDate.toISOString().split('T')[0];
      }

      // Get or initialize period data
      const periodData = periodMap.get(periodKey) || { revenue: 0, cost: 0 };

      // Add revenue (order total)
      periodData.revenue += order.total || 0;

      // Calculate cost for this order's items
      for (const item of order.items || []) {
        if (!item.productId || !item.quantity) continue;

        const product = productMap.get(item.productId);
        if (product) {
          const quantity = item.quantity || 0;
          periodData.cost += product.costPrice * quantity;
        }
      }

      periodMap.set(periodKey, periodData);
    }

    // Convert map to array, calculate profit, and sort by date
    const points = Array.from(periodMap.entries())
      .map(([date, data]) => ({
        date,
        profit: data.revenue - data.cost,
        cost: data.cost,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return points;
  }

  async getTopSellingProducts(limit: number = 10): Promise<
    Array<{
      productId: string;
      name: string;
      image?: string;
      slug: string;
      quantitySold: number;
      totalRevenue: number;
    }>
  > {
    // Get all delivered orders
    const deliveredOrders = await this.orderModel
      .find({ status: 'delivered' })
      .lean<Array<OrderDTO & { _id: unknown }>>();

    // Aggregate products by productId
    const productStats = new Map<
      string,
      { quantitySold: number; totalRevenue: number }
    >();

    for (const order of deliveredOrders) {
      for (const item of order.items || []) {
        if (!item.productId || !item.quantity) continue;

        const productId = item.productId;
        const quantity = item.quantity || 0;
        const itemPrice = item.price || 0;
        const revenue = itemPrice * quantity;

        const stats = productStats.get(productId) || {
          quantitySold: 0,
          totalRevenue: 0,
        };

        stats.quantitySold += quantity;
        stats.totalRevenue += revenue;

        productStats.set(productId, stats);
      }
    }

    // Get all unique product IDs
    const productIds = Array.from(productStats.keys());

    // Batch fetch products to get details
    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .lean<
        Array<{
          _id: unknown;
          name: string;
          slug: string;
          images: string[];
        }>
      >();

    // Create a map for quick product lookup
    const productMap = new Map<
      string,
      { name: string; slug: string; image?: string }
    >();
    for (const product of products) {
      const id = String(product._id);
      productMap.set(id, {
        name: product.name,
        slug: product.slug,
        image: product.images?.[0],
      });
    }

    // Combine stats with product details and sort by quantity sold
    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => {
        const product = productMap.get(productId);
        if (!product) {
          // Skip if product not found (deleted product)
          return null;
        }
        return {
          productId,
          name: product.name,
          image: product.image,
          slug: product.slug,
          quantitySold: stats.quantitySold,
          totalRevenue: stats.totalRevenue,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, limit);

    return topProducts;
  }

  async getDashboardStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    lowStockItems: number;
    recentOrders: OrderDTO[];
    salesPerDay: Array<{ day: number; revenue: number }>;
    topSellingProducts: Array<{
      productId: string;
      name?: string;
      image?: string;
      units: number;
      revenue: number;
    }>;
  }> {
    // Get all orders
    const allOrders = await this.orderModel
      .find({})
      .sort({ createdAt: -1 })
      .lean<Array<OrderDTO & { _id: unknown }>>();

    // Calculate total revenue (only delivered orders)
    const deliveredOrders = allOrders.filter((o) => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0,
    );

    // Total orders count
    const totalOrders = allOrders.length;

    // Get all products
    const allProducts = await this.productModel
      .find({})
      .select('_id name images stockQuantity')
      .lean<
        Array<{
          _id: unknown;
          name?: string;
          images?: string[];
          stockQuantity?: number | null;
        }>
      >();

    // Total products count
    const totalProducts = allProducts.length;

    // Low stock items (stockQuantity <= 5)
    const lowStockItems = allProducts.filter(
      (p) => typeof p.stockQuantity === 'number' && p.stockQuantity <= 5,
    ).length;

    // Recent orders (sorted by createdAt desc, limit 5)
    const recentOrders = allOrders.slice(0, 5);

    // Sales per day for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const salesPerDay: Array<{ day: number; revenue: number }> = Array.from(
      { length: daysInMonth },
      (_, i) => ({ day: i + 1, revenue: 0 }),
    );

    deliveredOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        salesPerDay[day - 1].revenue += o.total || 0;
      }
    });

    // Top selling products (aggregate by productId)
    // Only count delivered orders to match analytics page
    const salesByProduct: Record<
      string,
      {
        productId: string;
        name?: string;
        image?: string;
        units: number;
        revenue: number;
      }
    > = {};

    deliveredOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const productId = String(it.productId);
        const units = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        const revenue = units * price;
        const existing = salesByProduct[productId] || {
          productId,
          name: it.name,
          image: it.image,
          units: 0,
          revenue: 0,
        };
        existing.units += units;
        existing.revenue += revenue;
        salesByProduct[productId] = existing;
      });
    });

    const productIds = Object.keys(salesByProduct);
    const productMap = new Map<string, { name?: string; image?: string }>();

    if (productIds.length > 0) {
      const products = await this.productModel
        .find({ _id: { $in: productIds } })
        .select('name images')
        .lean<
          Array<{
            _id: unknown;
            name?: string;
            images?: string[];
          }>
        >();

      for (const product of products) {
        productMap.set(String(product._id), {
          name: product.name,
          image: product.images?.[0],
        });
      }
    }

    const topSellingProducts = Object.values(salesByProduct)
      .map((item) => {
        const product = productMap.get(item.productId);
        return {
          productId: item.productId,
          name: product?.name ?? item.name,
          image: product?.image ?? item.image,
          units: item.units,
          revenue: item.revenue,
        };
      })
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      lowStockItems,
      recentOrders,
      salesPerDay,
      topSellingProducts,
    };
  }

  async updateAdminOrderDetails(
    input: UpdateAdminOrderInput,
  ): Promise<OrderDTO | null> {
    const order = await this.getById(input.id);
    if (!order) return null;

    const updates: Partial<OrderModel> = {};
    const payload: Record<string, unknown> = {};

    const trimOrUndefined = (value?: string | null) => {
      if (value == null) return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const maybeSetString = <K extends keyof OrderModel>(
      key: K,
      value?: string | null,
    ) => {
      if (value === undefined) return;
      const trimmed = value?.trim?.();
      if (!trimmed) return;
      updates[key] = trimmed as OrderModel[K];
      payload[key as string] = trimmed;
    };

    maybeSetString('email', input.email);
    maybeSetString('firstName', input.firstName);
    maybeSetString('lastName', input.lastName);
    if (input.phone !== undefined) {
      updates.phone = trimOrUndefined(input.phone) ?? undefined;
      payload.phone = updates.phone ?? null;
    }
    maybeSetString('address1', input.address1);
    maybeSetString('city', input.city);
    maybeSetString('state', input.state);

    if (input.paymentReference !== undefined) {
      const reference = trimOrUndefined(input.paymentReference);
      updates.paymentReference = reference ?? null;
      payload.paymentReference = updates.paymentReference;
    }

    if (input.notes !== undefined) {
      const note = trimOrUndefined(input.notes);
      updates.notes = note ?? null;
      payload.notes = updates.notes;
    }

    let deliveryFee = Number(
      input.deliveryFee != null ? input.deliveryFee : (order.deliveryFee ?? 0),
    );
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      deliveryFee = 0;
    }
    updates.deliveryFee = deliveryFee;
    payload.deliveryFee = deliveryFee;

    let couponCode =
      input.couponCode === undefined
        ? order.couponCode
        : trimOrUndefined(input.couponCode);
    if (couponCode === '') {
      couponCode = undefined;
    }
    const couponDiscount =
      input.couponDiscount != null
        ? Math.max(0, input.couponDiscount)
        : (order.couponDiscount ?? 0);

    payload.couponCode = couponCode ?? null;
    payload.couponDiscount = couponDiscount;

    if (couponCode && couponDiscount > 0) {
      // validation happens in recalcTotals
    }

    let amountPaid = order.amountPaid ?? 0;
    if (input.amountPaid != null) {
      amountPaid = Math.max(0, Number(input.amountPaid));
      payload.amountPaid = amountPaid;
    }

    let amountRefunded = order.amountRefunded ?? 0;
    if (input.amountRefunded != null) {
      amountRefunded = Math.max(0, Number(input.amountRefunded));
      payload.amountRefunded = amountRefunded;
    }

    const totals = await this.recalcTotals({
      ...order,
      email: (updates.email as string) || order.email,
      firstName: (updates.firstName as string) || order.firstName,
      lastName: (updates.lastName as string) || order.lastName,
      address1: (updates.address1 as string) || order.address1,
      city: (updates.city as string) || order.city,
      state: (updates.state as string) || order.state,
      couponCode: couponCode ?? undefined,
      couponDiscount,
      deliveryFee,
      amountPaid,
      amountRefunded,
      items: order.items,
    } as OrderDTO & { items: NonNullable<OrderDTO['items']> });

    updates.subtotal = totals.subtotal;
    updates.total = totals.total;
    updates.balanceDue = totals.balanceDue;
    updates.couponCode = totals.couponCode;
    updates.couponDiscount = totals.couponDiscount;
    updates.amountPaid = amountPaid;
    updates.amountRefunded = amountRefunded;

    if (input.transferProofUrl !== undefined) {
      updates.transferProofUrl = trimOrUndefined(input.transferProofUrl);
      payload.transferProofUrl = updates.transferProofUrl;
    }

    if (
      totals.balanceDue <= 0 &&
      order.status === 'awaiting_additional_payment'
    ) {
      updates.status = 'confirmed';
    } else if (totals.balanceDue > 0 && order.status === 'confirmed') {
      updates.status = 'awaiting_additional_payment';
    }

    await this.orderModel.updateOne(
      { _id: order._id },
      {
        $set: updates,
        $push: {
          auditLog: {
            at: new Date(),
            type: 'ORDER_DETAILS_EDITED',
            payload,
          },
        },
      },
    );

    return this.getById(order._id);
  }
}
