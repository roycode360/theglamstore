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
      orderNumber
      createdAt
      updatedAt
      email
      firstName
      lastName
      phone
      address1
      city
      state
      subtotal
      total
      shippingFee
      couponCode
      couponDiscount
      paymentMethod
      status
      transferProofUrl
      amountPaid
      amountRefunded
      balanceDue
      paymentReference
      notes
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
  query ListOrdersPage(
    $page: Int!
    $pageSize: Int!
    $status: String
    $email: String
  ) {
    listOrdersPage(
      page: $page
      pageSize: $pageSize
      status: $status
      email: $email
    ) {
      items {
        _id
        orderNumber
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

export const GET_PENDING_ORDERS_COUNT = gql`
  query GetPendingOrdersCount {
    getPendingOrdersCount
  }
`;

export const CREATE_ADMIN_ORDER = gql`
  mutation CreateAdminOrder($input: CreateAdminOrderInput!) {
    createAdminOrder(input: $input) {
      _id
      orderNumber
      total
      amountPaid
      email
      createdAt
    }
  }
`;

export const UPDATE_ADMIN_ORDER = gql`
  mutation UpdateAdminOrder($input: UpdateAdminOrderInput!) {
    updateAdminOrder(input: $input) {
      _id
      orderNumber
      subtotal
      total
      shippingFee
      couponCode
      couponDiscount
      amountPaid
      amountRefunded
      balanceDue
      status
      paymentReference
      notes
      updatedAt
    }
  }
`;

export const EDIT_ORDER_ITEMS = gql`
  mutation EditOrderItems($input: EditOrderItemsInput!) {
    editOrderItems(input: $input) {
      _id
      orderNumber
      subtotal
      total
      shippingFee
      couponCode
      couponDiscount
      amountPaid
      amountRefunded
      balanceDue
      status
      updatedAt
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    getDashboardStats {
      totalRevenue
      totalOrders
      totalProducts
      lowStockItems
      recentOrders {
        _id
        orderNumber
        createdAt
        total
        status
        paymentMethod
        email
        firstName
        lastName
        items {
          productId
          name
          price
          quantity
          image
        }
      }
      salesPerDay {
        day
        revenue
      }
      topSellingProducts {
        productId
        name
        image
        units
        revenue
      }
    }
  }
`;
