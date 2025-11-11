import { gql } from '@apollo/client';

export const GET_USER_ANALYTICS_SUMMARY = gql`
  query GetUserAnalyticsSummary {
    getUserAnalyticsSummary {
      totalUsers
      newSignupsThisMonth
      activeUsersToday
      returningUsersThisWeek
    }
  }
`;

export const GET_USER_ACTIVITY_TREND = gql`
  query GetUserActivityTrend($period: String!, $days: Int) {
    getUserActivityTrend(period: $period, days: $days) {
      date
      activeUsers
      sessions
      newUsers
    }
  }
`;

export const GET_USER_PAGE_VISIT_TREND = gql`
  query GetUserPageVisitTrend($range: UserAnalyticsRangeInput) {
    getUserPageVisitTrend(range: $range) {
      date
      pageViews
      sessions
      averageSessionDuration
    }
  }
`;

export const GET_USER_TOP_PRODUCTS = gql`
  query GetUserTopProducts($limit: Int, $range: UserAnalyticsRangeInput) {
    getUserTopProducts(limit: $limit, range: $range) {
      productId
      name
      views
      clicks
      purchases
    }
  }
`;

export const GET_USER_TRAFFIC_OVERVIEW = gql`
  query GetUserTrafficOverview($range: UserAnalyticsRangeInput) {
    getUserTrafficOverview(range: $range) {
      countries {
        label
        value
      }
      sources {
        label
        value
      }
      devices {
        label
        value
      }
    }
  }
`;

export const GET_USER_BEHAVIOR_FUNNEL = gql`
  query GetUserBehaviorFunnel($range: UserAnalyticsRangeInput) {
    getUserBehaviorFunnel(range: $range) {
      key
      label
      count
    }
  }
`;

export const LIST_USERS_FOR_ANALYTICS = gql`
  query ListUsersForAnalytics($input: ListAnalyticsUsersInput) {
    listUsersForAnalytics(input: $input) {
      items {
        userId
        fullName
        email
        country
        region
        createdAt
        lastLoginAt
        lastSeenAt
        totalOrders
        totalSpend
        averageOrderValue
        totalSessions
      }
      total
      page
      pageSize
    }
  }
`;

export const GET_USER_ANALYTICS_USER = gql`
  query GetUserAnalyticsUser($userId: String!) {
    getUserAnalyticsUser(userId: $userId) {
      userId
      fullName
      email
      country
      region
      createdAt
      lastLoginAt
      lastSeenAt
      totalOrders
      totalSpend
      averageOrderValue
      totalSessions
      lifetimeOrders
      lifetimeSpend
      recentOrders {
        orderId
        orderNumber
        status
        total
        createdAt
      }
      recentEvents {
        eventType
        page
        productId
        device
        country
        source
        medium
        durationMs
        createdAt
      }
    }
  }
`;

export const EXPORT_USERS_FOR_ANALYTICS = gql`
  query ExportUsersForAnalytics($input: ListAnalyticsUsersInput) {
    exportUsersForAnalytics(input: $input) {
      rows {
        userId
        fullName
        email
        country
        region
        createdAt
        lastLoginAt
        lastSeenAt
        totalOrders
        totalSpend
        averageOrderValue
        totalSessions
      }
    }
  }
`;

export const RECORD_USER_EVENT = gql`
  mutation RecordUserEvent($input: RecordUserEventInput!) {
    recordUserEvent(input: $input)
  }
`;
