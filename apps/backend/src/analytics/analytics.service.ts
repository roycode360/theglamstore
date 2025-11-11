import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserEventDocument,
  UserEventModel,
} from './schemas/user-event.schema.js';
import {
  UserAnalyticsRangeInput,
  ListAnalyticsUsersInput,
  RecordUserEventInput,
} from './dto/user-analytics-range.input.js';
import { UserAnalyticsSummary } from './entities/user-analytics-summary.entity.js';
import { UserActivityPoint } from './entities/user-activity-point.entity.js';
import { UserTrafficBreakdown } from './entities/user-traffic-breakdown.entity.js';
import { UserFunnelStep } from './entities/user-funnel-step.entity.js';
import { UserAnalyticsTopProduct } from './entities/user-analytics-top-product.entity.js';
import {
  UserAnalyticsUser,
  UserAnalyticsUserPage,
} from './entities/user-analytics-user.entity.js';
import { UserAnalyticsDetail } from './entities/user-analytics-detail.entity.js';
import { UserPageMetricPoint } from './entities/user-page-metric-point.entity.js';
import { UserDocument, UserModel } from '../users/schemas/user.schema.js';
import { OrderDocument, OrderModel } from '../orders/schemas/order.schema.js';
import {
  ProductDocument,
  ProductModel,
} from '../products/schemas/product.schema.js';
import { Types } from 'mongoose';
type DateRange = { start?: Date | null; end?: Date | null };
type KeyValueAggregation = { _id: string; total: number };
type LeanUserDoc = {
  _id: string;
  email: string;
  fullName: string;
  country?: string | null;
  region?: string | null;
  createdAt?: Date | null;
  lastLoginAt?: Date | null;
  lastSeenAt?: Date | null;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(UserEventModel.name)
    private readonly userEventModel: Model<UserEventDocument>,
    @InjectModel(UserModel.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(OrderModel.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(ProductModel.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  private resolveRange(range?: UserAnalyticsRangeInput | null): DateRange {
    const end = range?.end ? new Date(range.end) : new Date();
    let start: Date | undefined;
    if (range?.start) {
      start = new Date(range.start);
    }
    return { start, end };
  }

  private applyRangeFilter(base: Record<string, unknown>, range?: DateRange) {
    if (!range?.start && !range?.end) {
      return base;
    }
    base.createdAt = {};
    if (range.start) {
      (base.createdAt as Record<string, unknown>).$gte = range.start;
    }
    if (range.end) {
      (base.createdAt as Record<string, unknown>).$lte = range.end;
    }
    return base;
  }

  private async distinctUserIds(
    match: Record<string, unknown>,
  ): Promise<string[]> {
    const ids = await this.userEventModel.distinct<string>('userId', match);
    return ids.filter((id): id is string => typeof id === 'string');
  }

  async recordUserEvent(
    input: RecordUserEventInput,
    userId?: string,
  ): Promise<void> {
    await this.userEventModel.create({
      eventType: input.eventType,
      userId: userId ?? null,
      sessionId: input.sessionId ?? null,
      source: input.source ?? null,
      medium: input.medium ?? null,
      campaign: input.campaign ?? null,
      page: input.page ?? null,
      productId: input.productId ?? null,
      device: input.device ?? null,
      country: input.country ?? null,
      durationMs: input.durationMs ?? null,
    });
    if (userId) {
      const update: Record<string, unknown> = { lastSeenAt: new Date() };
      if (input.country) {
        update.country = input.country;
      }
      await this.userModel.updateOne({ _id: userId }, { $set: update });
    }
  }

  async getSummary(): Promise<UserAnalyticsSummary> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7,
    );
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const [totalUsers, newSignupsThisMonth] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({
        createdAt: { $gte: monthStart },
      }),
    ]);

    const activeUserIdsToday = await this.distinctUserIds({
      createdAt: { $gte: todayStart },
      userId: { $ne: null },
    });
    const recentUserIds = await this.distinctUserIds({
      createdAt: { $gte: weekStart },
      userId: { $ne: null },
    });
    const previousUserIds = await this.distinctUserIds({
      createdAt: {
        $lt: weekStart,
        $gte: new Date(weekStart.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
      userId: { $ne: null },
    });
    const previousSet = new Set(
      previousUserIds.filter((id): id is string => typeof id === 'string'),
    );
    const returningUsersThisWeek = recentUserIds.filter(
      (id): id is string => typeof id === 'string' && previousSet.has(id),
    ).length;

    return {
      totalUsers,
      newSignupsThisMonth,
      activeUsersToday: activeUserIdsToday.length,
      returningUsersThisWeek,
    };
  }

  async getActivityTrend(params: {
    period: 'daily' | 'weekly';
    days?: number | null;
    range?: UserAnalyticsRangeInput | null;
  }): Promise<UserActivityPoint[]> {
    const range = this.resolveRange(params.range ?? null);
    const period = params.period ?? 'daily';
    let start: Date | undefined = range.start ?? undefined;
    const days = params.days ?? (period === 'daily' ? 14 : 12);
    if (!start) {
      const useDays = Math.max(1, days);
      start =
        period === 'daily'
          ? new Date(Date.now() - useDays * 24 * 60 * 60 * 1000)
          : new Date(Date.now() - useDays * 7 * 24 * 60 * 60 * 1000);
    }

    const match: Record<string, unknown> = {
      createdAt: { $gte: start },
    };
    if (range.end) {
      (match.createdAt as Record<string, unknown>).$lte = range.end;
    }

    const dateExpression =
      period === 'weekly'
        ? {
            $dateToString: {
              format: '%G-W%V',
              date: '$createdAt',
            },
          }
        : {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          };

    const aggregation = await this.userEventModel
      .aggregate<{
        _id: string;
        activeUsers: number;
        sessions: number;
      }>([
        { $match: match },
        {
          $group: {
            _id: dateExpression,
            userSet: {
              $addToSet: '$userId',
            },
            sessionSet: {
              $addToSet: '$sessionId',
            },
          },
        },
        {
          $project: {
            _id: 1,
            activeUsers: {
              $size: {
                $filter: {
                  input: '$userSet',
                  as: 'uid',
                  cond: {
                    $and: [{ $ne: ['$$uid', null] }, { $ne: ['$$uid', ''] }],
                  },
                },
              },
            },
            sessions: {
              $size: {
                $filter: {
                  input: '$sessionSet',
                  as: 'sid',
                  cond: {
                    $and: [{ $ne: ['$$sid', null] }, { $ne: ['$$sid', ''] }],
                  },
                },
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();

    const newUsersByDate = await this.userModel
      .aggregate<{
        _id: string;
        count: number;
      }>([
        {
          $match: {
            createdAt: {
              $gte: start,
              ...(range.end ? { $lte: range.end } : {}),
            },
          },
        },
        {
          $group: {
            _id:
              period === 'weekly'
                ? {
                    $dateToString: {
                      format: '%G-W%V',
                      date: '$createdAt',
                    },
                  }
                : {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$createdAt',
                    },
                  },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();

    const newUserMap = new Map<string, number>(
      newUsersByDate.map((item) => [item._id, item.count]),
    );

    return aggregation.map((point) => ({
      date: point._id,
      activeUsers: point.activeUsers,
      sessions: point.sessions,
      newUsers: newUserMap.get(point._id) ?? 0,
    }));
  }

  async getPageVisitTrend(
    rangeInput?: UserAnalyticsRangeInput | null,
  ): Promise<UserPageMetricPoint[]> {
    const range = this.resolveRange(rangeInput ?? null);
    const start =
      range.start ?? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const match: Record<string, unknown> = {
      eventType: 'page_view',
      createdAt: { $gte: start },
    };
    if (range.end) {
      (match.createdAt as Record<string, unknown>).$lte = range.end;
    }

    const aggregation = await this.userEventModel
      .aggregate<{
        _id: string;
        pageViews: number;
        sessionsCount: number;
        duration: number;
      }>([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            pageViews: { $sum: 1 },
            sessions: {
              $addToSet: {
                $cond: [
                  { $ifNull: ['$sessionId', false] },
                  '$sessionId',
                  '$$REMOVE',
                ],
              },
            },
            duration: { $sum: { $ifNull: ['$durationMs', 0] } },
          },
        },
        {
          $project: {
            _id: 1,
            pageViews: 1,
            sessionsCount: { $size: '$sessions' },
            duration: 1,
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();

    return aggregation.map((point) => ({
      date: point._id,
      pageViews: point.pageViews,
      sessions: point.sessionsCount,
      averageSessionDuration:
        point.sessionsCount > 0
          ? Math.round(point.duration / point.sessionsCount)
          : 0,
    }));
  }

  async getTopProducts(
    limit = 5,
    rangeInput?: UserAnalyticsRangeInput | null,
  ): Promise<UserAnalyticsTopProduct[]> {
    const range = this.resolveRange(rangeInput ?? null);
    const match: Record<string, unknown> = {
      productId: { $ne: null },
      eventType: { $in: ['product_view', 'product_click'] },
    };
    this.applyRangeFilter(match, range);

    const aggregation = await this.userEventModel
      .aggregate<{
        _id: string;
        views: number;
        clicks: number;
      }>([
        { $match: match },
        {
          $group: {
            _id: '$productId',
            views: {
              $sum: {
                $cond: [{ $eq: ['$eventType', 'product_view'] }, 1, 0],
              },
            },
            clicks: {
              $sum: {
                $cond: [{ $eq: ['$eventType', 'product_click'] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { views: -1, clicks: -1 },
        },
        { $limit: limit },
      ])
      .exec();

    const productIds = aggregation
      .map((item) => item._id)
      .filter((id): id is string => typeof id === 'string');
    const productObjectIds = productIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const productDocs =
      productObjectIds.length > 0
        ? await this.productModel
            .find({ _id: { $in: productObjectIds } })
            .select('_id name')
            .lean<Array<ProductDocument & { name?: string }>>()
        : [];
    const nameMap = new Map(
      productDocs.map((doc) => [String(doc._id), doc.name ?? '']),
    );

    const purchases = await this.orderModel
      .aggregate<{
        _id: string;
        purchases: number;
      }>([
        {
          $match: {
            ...(range.start ? { createdAt: { $gte: range.start } } : {}),
            ...(range.end ? { createdAt: { $lte: range.end } } : {}),
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            purchases: { $sum: '$items.quantity' },
          },
        },
      ])
      .exec();
    const purchaseMap = new Map(
      purchases
        .filter((p) => typeof p._id === 'string')
        .map((p) => [String(p._id), p.purchases]),
    );

    return aggregation.map((item) => {
      const productId = item._id ?? '';
      return {
        productId,
        name: nameMap.get(productId) ?? 'Unknown product',
        views: item.views ?? 0,
        clicks: item.clicks ?? 0,
        purchases: purchaseMap.get(productId) ?? 0,
      };
    });
  }

  async getTrafficBreakdown(
    rangeInput?: UserAnalyticsRangeInput | null,
  ): Promise<UserTrafficBreakdown> {
    const range = this.resolveRange(rangeInput ?? null);
    const match: Record<string, unknown> = {};
    this.applyRangeFilter(match, range);

    const [countries, sources, devices] = await Promise.all([
      this.userEventModel
        .aggregate<KeyValueAggregation>([
          { $match: { ...match, country: { $ne: null } } },
          { $group: { _id: '$country', total: { $sum: 1 } } },
          { $sort: { total: -1 } },
          { $limit: 10 },
        ])
        .exec(),
      this.userEventModel
        .aggregate<KeyValueAggregation>([
          { $match: { ...match, source: { $ne: null } } },
          { $group: { _id: '$source', total: { $sum: 1 } } },
          { $sort: { total: -1 } },
          { $limit: 10 },
        ])
        .exec(),
      this.userEventModel
        .aggregate<KeyValueAggregation>([
          { $match: { ...match, device: { $ne: null } } },
          { $group: { _id: '$device', total: { $sum: 1 } } },
          { $sort: { total: -1 } },
          { $limit: 10 },
        ])
        .exec(),
    ]);

    const toKeyValue = (items: { _id: string; total: number }[]) =>
      items
        .filter((item) => item._id)
        .map((item) => ({
          label: item._id,
          value: item.total,
        }));

    return {
      countries: toKeyValue(countries),
      sources: toKeyValue(sources),
      devices: toKeyValue(devices),
    };
  }

  async getPurchaseFunnel(
    rangeInput?: UserAnalyticsRangeInput | null,
  ): Promise<UserFunnelStep[]> {
    const range = this.resolveRange(rangeInput ?? null);
    const baseMatch: Record<string, unknown> = {};
    this.applyRangeFilter(baseMatch, range);

    const [visits, productViews, addToCart, checkout, purchases] =
      await Promise.all([
        this.userEventModel.countDocuments({
          ...baseMatch,
          eventType: 'session_start',
        }),
        this.userEventModel.countDocuments({
          ...baseMatch,
          eventType: 'product_view',
        }),
        this.userEventModel.countDocuments({
          ...baseMatch,
          eventType: 'add_to_cart',
        }),
        this.userEventModel.countDocuments({
          ...baseMatch,
          eventType: 'checkout_start',
        }),
        this.orderModel.countDocuments(
          this.applyRangeFilter(
            {
              status: {
                $in: ['confirmed', 'processing', 'shipped', 'delivered'],
              },
            },
            range,
          ),
        ),
      ]);

    const steps: Array<[string, string, number]> = [
      ['sessions', 'Sessions', visits],
      ['product_views', 'Product views', productViews],
      ['add_to_cart', 'Add to cart', addToCart],
      ['checkout', 'Checkout started', checkout],
      ['purchases', 'Purchases', purchases],
    ];

    return steps.map(([key, label, count]) => ({
      key,
      label,
      count,
    }));
  }

  private buildUserQuery(
    input: ListAnalyticsUsersInput | Record<string, never>,
  ) {
    const query: Record<string, unknown> = {};
    if (input.search) {
      const regex = new RegExp(input.search, 'i');
      query.$or = [{ fullName: regex }, { email: regex }];
    }
    if (input.country) {
      query.country = input.country;
    }
    return query;
  }

  private async buildUserSummaries(
    users: LeanUserDoc[],
  ): Promise<UserAnalyticsUser[]> {
    if (users.length === 0) return [];

    const emails = users.map((user) => user.email);
    const userIds = users.map((user) => String(user._id));

    const orderStats = await this.orderModel
      .aggregate<{
        _id: string;
        totalOrders: number;
        totalSpend: number;
      }>([
        { $match: { email: { $in: emails } } },
        {
          $group: {
            _id: '$email',
            totalOrders: { $sum: 1 },
            totalSpend: { $sum: { $ifNull: ['$total', 0] } },
          },
        },
      ])
      .exec();
    const orderMap = new Map(
      orderStats.map((stat) => [
        typeof stat._id === 'string' ? stat._id : String(stat._id),
        {
          totalOrders: stat.totalOrders,
          totalSpend: stat.totalSpend,
        },
      ]),
    );

    const sessionStats = await this.userEventModel
      .aggregate<{
        _id: string;
        sessions: number;
      }>([
        {
          $match: {
            userId: { $in: userIds },
            eventType: 'session_start',
          },
        },
        {
          $group: {
            _id: '$userId',
            sessions: { $sum: 1 },
          },
        },
      ])
      .exec();
    const sessionMap = new Map(
      sessionStats.map((stat) => [stat._id, stat.sessions]),
    );

    return users.map((user) => {
      const userId = String(user._id);
      const orderInfo = orderMap.get(user.email) ?? {
        totalOrders: 0,
        totalSpend: 0,
      };
      const totalOrders = orderInfo.totalOrders ?? 0;
      const totalSpend = orderInfo.totalSpend ?? 0;
      const averageOrderValue =
        totalOrders > 0 ? Number((totalSpend / totalOrders).toFixed(2)) : 0;
      return {
        userId,
        fullName: user.fullName,
        email: user.email,
        country: user.country ?? null,
        region: user.region ?? null,
        createdAt: user.createdAt ?? null,
        lastLoginAt: user.lastLoginAt ?? null,
        lastSeenAt: user.lastSeenAt ?? null,
        totalOrders,
        totalSpend,
        averageOrderValue,
        totalSessions: sessionMap.get(userId) ?? 0,
      };
    });
  }

  async listUsers(
    input: ListAnalyticsUsersInput | Record<string, never> = {},
  ): Promise<UserAnalyticsUserPage> {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25));
    const skip = (page - 1) * pageSize;

    const query = this.buildUserQuery(input);

    const users = await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean<LeanUserDoc[]>()
      .exec();
    const total = await this.userModel.countDocuments(query);

    const analyticsUsers = await this.buildUserSummaries(users);

    return {
      items: analyticsUsers,
      total,
      page,
      pageSize,
    };
  }

  async exportUsers(
    input: ListAnalyticsUsersInput | Record<string, never> = {},
  ): Promise<UserAnalyticsUser[]> {
    const query = this.buildUserQuery(input);
    const users = await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(5000, input.pageSize ?? 5000))
      .lean<LeanUserDoc[]>()
      .exec();
    return this.buildUserSummaries(users);
  }

  async getUserDetail(userId: string): Promise<UserAnalyticsDetail | null> {
    const userDoc = await this.userModel
      .findById(userId)
      .lean<LeanUserDoc | null>();
    if (!userDoc) return null;
    const [summary] = await this.buildUserSummaries([userDoc]);
    if (!summary) return null;

    const [orders, events] = await Promise.all([
      this.orderModel
        .find({ email: userDoc.email })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('_id orderNumber status total createdAt')
        .lean<
          Array<{
            _id: unknown;
            orderNumber?: string | null;
            status?: string;
            total?: number;
            createdAt?: Date;
          }>
        >(),
      this.userEventModel
        .find({ userId: String(userDoc._id) })
        .sort({ createdAt: -1 })
        .limit(15)
        .lean<
          Array<{
            eventType: string;
            page?: string | null;
            productId?: string | null;
            device?: string | null;
            country?: string | null;
            source?: string | null;
            medium?: string | null;
            durationMs?: number | null;
            createdAt: Date;
          }>
        >(),
    ]);

    const orderSummaries = orders.map((order) => ({
      orderId: String(order._id),
      orderNumber: order.orderNumber ?? null,
      status: order.status ?? 'pending',
      total: order.total ?? 0,
      createdAt: order.createdAt ?? null,
    }));

    const eventSummaries = events.map((event) => ({
      eventType: event.eventType,
      page: event.page ?? null,
      productId: event.productId ?? null,
      device: event.device ?? null,
      country: event.country ?? null,
      source: event.source ?? null,
      medium: event.medium ?? null,
      durationMs: event.durationMs ?? null,
      createdAt: event.createdAt,
    }));

    return {
      ...summary,
      lifetimeOrders: summary.totalOrders,
      lifetimeSpend: summary.totalSpend,
      recentOrders: orderSummaries,
      recentEvents: eventSummaries,
    };
  }
}
