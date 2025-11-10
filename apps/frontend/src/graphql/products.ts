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
      costPrice
      stockQuantity
      images
      colors
      sizes
      description
      active
      featured
      slug
      sku
      reviewCount
      reviewAverage
    }
  }
`;

export const LIST_PRODUCTS_PAGE = gql`
  query ListProductsPage(
    $page: Int!
    $pageSize: Int!
    $search: String
    $category: String
    $brand: String
    $minPrice: Float
    $maxPrice: Float
    $inStockOnly: Boolean
    $onSaleOnly: Boolean
    $active: Boolean
    $outOfStock: Boolean
    $sortBy: String
    $sortDir: String
  ) {
    listProductsPage(
      page: $page
      pageSize: $pageSize
      search: $search
      category: $category
      brand: $brand
      minPrice: $minPrice
      maxPrice: $maxPrice
      inStockOnly: $inStockOnly
      onSaleOnly: $onSaleOnly
      active: $active
      outOfStock: $outOfStock
      sortBy: $sortBy
      sortDir: $sortDir
    ) {
      items {
        _id
        name
        brand
        category
        price
        salePrice
        costPrice
        stockQuantity
        images
        slug
        sku
        description
        sizes
        colors
        active
        featured
      }
      total
      page
      pageSize
      totalPages
    }
  }
`;

export const LIST_FEATURED = gql`
  query ListFeaturedProducts {
    listFeaturedProducts {
      _id
      name
      brand
      price
      salePrice
      images
      category
      featured
    }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      _id
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      _id
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
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
