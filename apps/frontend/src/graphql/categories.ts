import { gql } from '@apollo/client';

export const LIST_CATEGORIES = gql`
  query ListCategories {
    listCategories {
      _id
      name
      slug
      parentId
      image
      description
      active
    }
  }
`;

export const LIST_SUBCATEGORIES = gql`
  query ListSubcategories($parentId: ID!) {
    listSubcategories(parentId: $parentId) {
      _id
      name
      slug
      parentId
    }
  }
`;

