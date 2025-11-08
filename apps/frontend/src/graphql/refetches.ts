import {
  GET_DASHBOARD_STATS,
  GET_PENDING_ORDERS_COUNT,
} from './orders';
import {
  GET_ANALYTICS,
  GET_REVENUE_TREND,
  GET_PROFIT_COST_COMPARISON,
  GET_TOP_SELLING_PRODUCTS,
} from './analytics';
import { DocumentNode } from '@apollo/client';

type PureQuery = { query: DocumentNode; variables?: Record<string, unknown> };

const BASE_ANALYTICS_REFETCHES: PureQuery[] = [
  { query: GET_DASHBOARD_STATS },
  { query: GET_ANALYTICS },
  { query: GET_REVENUE_TREND, variables: { period: 'daily' } },
  { query: GET_REVENUE_TREND, variables: { period: 'weekly' } },
  { query: GET_REVENUE_TREND, variables: { period: 'monthly' } },
  { query: GET_PROFIT_COST_COMPARISON, variables: { period: 'daily' } },
  { query: GET_PROFIT_COST_COMPARISON, variables: { period: 'weekly' } },
  { query: GET_PROFIT_COST_COMPARISON, variables: { period: 'monthly' } },
  { query: GET_TOP_SELLING_PRODUCTS, variables: { limit: 10 } },
  { query: GET_PENDING_ORDERS_COUNT },
];

export function getAnalyticsRefetches(): PureQuery[] {
  return BASE_ANALYTICS_REFETCHES.map(({ query, variables }) =>
    variables ? { query, variables: { ...variables } } : { query },
  );
}


