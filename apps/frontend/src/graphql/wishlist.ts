import { gql } from '@apollo/client';

export const LIST_WISHLIST = gql`
  query ListWishlist {
    listWishlist {
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

export const ADD_TO_WISHLIST = gql`
  mutation AddToWishlist(
    $productId: String!
    $selectedSize: String
    $selectedColor: String
  ) {
    addToWishlist(
      productId: $productId
      selectedSize: $selectedSize
      selectedColor: $selectedColor
    )
  }
`;

export const REMOVE_FROM_WISHLIST = gql`
  mutation RemoveFromWishlist(
    $productId: String!
    $selectedSize: String
    $selectedColor: String
  ) {
    removeFromWishlist(
      productId: $productId
      selectedSize: $selectedSize
      selectedColor: $selectedColor
    )
  }
`;
