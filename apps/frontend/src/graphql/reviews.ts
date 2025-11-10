import { gql } from '@apollo/client';

export const LIST_PRODUCT_REVIEWS = gql`
  query ListProductReviews($productId: String!) {
    listProductReviews(productId: $productId) {
      _id
      customerName
      customerAvatarUrl
      rating
      message
      createdAt
      status
    }
  }
`;

export const GET_REVIEW_ELIGIBILITY = gql`
  query GetReviewEligibility($productId: String!) {
    getReviewEligibility(productId: $productId) {
      hasPurchased
      canReview
      existingReview {
        _id
        rating
        message
        status
        createdAt
      }
    }
  }
`;

export const SUBMIT_PRODUCT_REVIEW = gql`
  mutation SubmitProductReview($input: SubmitReviewInput!) {
    submitProductReview(input: $input) {
      _id
      status
    }
  }
`;

export const LIST_PENDING_REVIEWS = gql`
  query ListPendingReviews($limit: Int) {
    listPendingReviews(limit: $limit) {
      _id
      productId
      productName
      productSlug
      productImage
      orderNumber
      customerName
      customerEmail
      customerAvatarUrl
      rating
      message
      status
      createdAt
    }
  }
`;

export const MODERATE_REVIEW = gql`
  mutation ModerateReview($input: ModerateReviewInput!) {
    moderateReview(input: $input) {
      _id
      status
      moderatedAt
      moderatedBy
      rejectionReason
    }
  }
`;
