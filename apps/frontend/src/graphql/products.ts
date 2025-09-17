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
