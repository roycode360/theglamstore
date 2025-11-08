import { gql } from '@apollo/client';

export const VALIDATE_COUPON = gql`
  query ValidateCoupon($code: String!, $orderAmount: Float!, $userId: String) {
    validateCoupon(code: $code, orderAmount: $orderAmount, userId: $userId) {
      valid
      message
      discountAmount
      newTotal
      code
    }
  }
`;

export const LIST_COUPONS = gql`
  query ListCoupons {
    listCoupons {
      _id
      code
      discountType
      discountValue
      minOrderAmount
      maxDiscount
      usageLimit
      usedCount
      isActive
      expiresAt
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_COUPON = gql`
  mutation CreateCoupon($input: CreateCouponInput!) {
    createCoupon(input: $input) {
      _id
      code
      discountType
      discountValue
      minOrderAmount
      maxDiscount
      usageLimit
      usedCount
      isActive
      expiresAt
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_COUPON = gql`
  mutation UpdateCoupon($id: ID!, $input: UpdateCouponInput!) {
    updateCoupon(id: $id, input: $input) {
      _id
      code
      discountType
      discountValue
      minOrderAmount
      maxDiscount
      usageLimit
      usedCount
      isActive
      expiresAt
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_COUPON = gql`
  mutation DeleteCoupon($id: ID!) {
    deleteCoupon(id: $id)
  }
`;

export const SET_COUPON_ACTIVE = gql`
  mutation SetCouponActive($id: ID!, $isActive: Boolean!) {
    setCouponActive(id: $id, isActive: $isActive) {
      _id
      isActive
      updatedAt
    }
  }
`;
