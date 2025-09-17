import { gql } from '@apollo/client';

export const CREATE_BANK_TRANSFER_ORDER = gql`
  mutation CreateBankTransferOrder($payload: String!) {
    createBankTransferOrder(payload: $payload)
  }
`;

export const LIST_ORDERS = gql`
  query ListOrders {
    listOrders {
      _id
      createdAt
      email
      firstName
      lastName
      total
      paymentMethod
      status
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: String!) {
    getOrder(id: $id) {
      _id
      createdAt
      email
      firstName
      lastName
      phone
      address1
      city
      state
      subtotal
      tax
      total
      paymentMethod
      status
      transferProofUrl
      items {
        productId
        name
        price
        quantity
        selectedSize
        selectedColor
        image
      }
    }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: String!, $status: String!) {
    updateOrderStatus(id: $id, status: $status) {
      _id
      status
      updatedAt
    }
  }
`;

export const DELETE_ORDER = gql`
  mutation DeleteOrder($id: String!) {
    deleteOrder(id: $id)
  }
`;

export const LIST_ORDERS_PAGE = gql`
  query ListOrdersPage($page: Int!, $pageSize: Int!, $status: String) {
    listOrdersPage(page: $page, pageSize: $pageSize, status: $status) {
      items {
        _id
        createdAt
        email
        firstName
        lastName
        total
        paymentMethod
        status
      }
      total
      page
      pageSize
      totalPages
    }
  }
`;
