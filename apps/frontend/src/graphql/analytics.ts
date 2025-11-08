import { gql } from '@apollo/client';

export const GET_ANALYTICS = gql`
  query GetAnalytics {
    getAnalytics {
      totalRevenue
      totalProfit
      totalCostPrice
      totalSellingPrice
      inventoryValue
      numberOfCustomers
      numberOfReturningCustomers
      numberOfCompletedOrders
      totalProductsSold
    }
  }
`;

export const GET_REVENUE_TREND = gql`
  query GetRevenueTrend($period: String) {
    getRevenueTrend(period: $period) {
      points {
        date
        revenue
      }
    }
  }
`;

export const GET_PROFIT_COST_COMPARISON = gql`
  query GetProfitCostComparison($period: String) {
    getProfitCostComparison(period: $period) {
      points {
        date
        profit
        cost
      }
    }
  }
`;

export const GET_TOP_SELLING_PRODUCTS = gql`
  query GetTopSellingProducts($limit: Int) {
    getTopSellingProducts(limit: $limit) {
      products {
        productId
        name
        image
        slug
        quantitySold
        totalRevenue
      }
    }
  }
`;

