import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { UserAnalyticsSummary } from './entities/user-analytics-summary.entity.js';
import { UserActivityPoint } from './entities/user-activity-point.entity.js';
import { UserTrafficBreakdown } from './entities/user-traffic-breakdown.entity.js';
import { UserFunnelStep } from './entities/user-funnel-step.entity.js';
import { UserAnalyticsTopProduct } from './entities/user-analytics-top-product.entity.js';
import {
  UserAnalyticsRangeInput,
  ListAnalyticsUsersInput,
  RecordUserEventInput,
} from './dto/user-analytics-range.input.js';
import { UserAnalyticsUserPage } from './entities/user-analytics-user.entity.js';
import { UserAnalyticsDetail } from './entities/user-analytics-detail.entity.js';
import { UserAnalyticsExport } from './entities/user-analytics-export.entity.js';
import { UserPageMetricPoint } from './entities/user-page-metric-point.entity.js';
import { GqlAuthGuard } from '../auth/gql-auth.guard.js';
import { Roles, RolesGuard } from '../auth/roles.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AuthUser } from '../auth/auth.types.js';
import { isPublic } from '../auth/decorators.js';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analytics: AnalyticsService) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => UserAnalyticsSummary)
  async getUserAnalyticsSummary(): Promise<UserAnalyticsSummary> {
    return this.analytics.getSummary();
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => [UserActivityPoint])
  async getUserActivityTrend(
    @Args('period', { type: () => String, defaultValue: 'daily' })
    period: 'daily' | 'weekly',
    @Args('days', { type: () => Int, nullable: true })
    days?: number | null,
    @Args('range', { type: () => UserAnalyticsRangeInput, nullable: true })
    range?: UserAnalyticsRangeInput | null,
  ): Promise<UserActivityPoint[]> {
    return this.analytics.getActivityTrend({ period, days, range });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => [UserPageMetricPoint])
  async getUserPageVisitTrend(
    @Args('range', { type: () => UserAnalyticsRangeInput, nullable: true })
    range?: UserAnalyticsRangeInput | null,
  ): Promise<UserPageMetricPoint[]> {
    return this.analytics.getPageVisitTrend(range);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => [UserAnalyticsTopProduct])
  async getUserTopProducts(
    @Args('limit', { type: () => Int, nullable: true })
    limit?: number | null,
    @Args('range', { type: () => UserAnalyticsRangeInput, nullable: true })
    range?: UserAnalyticsRangeInput | null,
  ): Promise<UserAnalyticsTopProduct[]> {
    return this.analytics.getTopProducts(limit ?? 5, range);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => UserTrafficBreakdown)
  async getUserTrafficOverview(
    @Args('range', { type: () => UserAnalyticsRangeInput, nullable: true })
    range?: UserAnalyticsRangeInput | null,
  ): Promise<UserTrafficBreakdown> {
    return this.analytics.getTrafficBreakdown(range);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => [UserFunnelStep])
  async getUserBehaviorFunnel(
    @Args('range', { type: () => UserAnalyticsRangeInput, nullable: true })
    range?: UserAnalyticsRangeInput | null,
  ): Promise<UserFunnelStep[]> {
    return this.analytics.getPurchaseFunnel(range);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => UserAnalyticsUserPage)
  async listUsersForAnalytics(
    @Args('input', {
      type: () => ListAnalyticsUsersInput,
      nullable: true,
    })
    input?: ListAnalyticsUsersInput | null,
  ): Promise<UserAnalyticsUserPage> {
    return this.analytics.listUsers(input ?? {});
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => UserAnalyticsDetail, { nullable: true })
  async getUserAnalyticsUser(
    @Args('userId', { type: () => String }) userId: string,
  ): Promise<UserAnalyticsDetail | null> {
    return this.analytics.getUserDetail(userId);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => UserAnalyticsExport)
  async exportUsersForAnalytics(
    @Args('input', { type: () => ListAnalyticsUsersInput, nullable: true })
    input?: ListAnalyticsUsersInput | null,
  ): Promise<UserAnalyticsExport> {
    const rows = await this.analytics.exportUsers(input ?? {});
    return { rows };
  }

  @Mutation(() => Boolean)
  @isPublic()
  async recordUserEvent(
    @Args('input', { type: () => RecordUserEventInput })
    input: RecordUserEventInput,
    @CurrentUser() user: AuthUser | null,
  ): Promise<boolean> {
    await this.analytics.recordUserEvent(input, user?.id);
    return true;
  }
}
