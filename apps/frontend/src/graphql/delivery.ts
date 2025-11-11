import { gql } from '@apollo/client';

export const LIST_DELIVERY_LOCATIONS = gql`
  query ListDeliveryLocations {
    listDeliveryLocations {
      _id
      name
      price
      active
      isDefault
    }
  }
`;

export const UPSERT_DELIVERY_LOCATION = gql`
  mutation UpsertDeliveryLocation($input: UpsertDeliveryLocationInput!) {
    upsertDeliveryLocation(input: $input) {
      _id
      name
      price
      active
      isDefault
    }
  }
`;

export const DELETE_DELIVERY_LOCATION = gql`
  mutation DeleteDeliveryLocation($id: ID!) {
    deleteDeliveryLocation(id: $id)
  }
`;
