import { gql } from '@apollo/client';

export const GET_CART_ITEMS = gql`
  query GetCartItems {
    getCartItems {
      _id
      quantity
      selectedSize
      selectedColor
      createdAt
      product {
        _id
        name
        brand
        price
        salePrice
        images
        description
        stockQuantity
      }
    }
  }
`;

export const GET_CART_ITEM_COUNT = gql`
  query GetCartItemCount {
    getCartItemCount
  }
`;

export const ADD_TO_CART = gql`
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      # id
      quantity
      selectedSize
      selectedColor
      product {
        name
        brand
        price
        salePrice
        images
      }
    }
  }
`;

export const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($input: UpdateCartItemInput!) {
    updateCartItem(input: $input) {
      _id
      quantity
      selectedSize
      selectedColor
      product {
        _id
        name
        brand
        price
        salePrice
        images
      }
    }
  }
`;

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($input: RemoveFromCartInput!) {
    removeFromCart(input: $input)
  }
`;

export const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart
  }
`;
