import { gql } from '@apollo/client';

export const LIST_PRODUCTS = gql`
  query ListProducts {
    listProducts {
      _id
      name
      brand
      category
      price
      salePrice
      stockQuantity
      images
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    getProduct(id: $id) {
      _id
      name
      brand
      category
      price
      salePrice
      stockQuantity
      images
      colors
      sizes
      description
      active
    }
  }
`;

export const LIST_PRODUCTS_BY_CATEGORY = gql`
  query ListProductsByCategory(
    $category: String!
    $limit: Int
    $excludeId: ID
  ) {
    listProductsByCategory(
      category: $category
      limit: $limit
      excludeId: $excludeId
    ) {
      _id
      name
      brand
      category
      price
      salePrice
      stockQuantity
      images
    }
  }
`;
