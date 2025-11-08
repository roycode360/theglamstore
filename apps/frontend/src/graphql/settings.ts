import { gql } from '@apollo/client';

export const GET_COMPANY_SETTINGS = gql`
  query GetCompanySettings {
    companySettings {
      _id
      businessName
      accountName
      accountNumber
      bankName
      contactEmail
      contactPhone
      address
      accountInstructions
      promoEnabled
      promoTitle
      promoSubtitle
      promoMessage
      promoImageUrl
      promoCtaLabel
      promoCtaLink
      promoDelaySeconds
      founders {
        name
        title
        bio
        imageUrl
        order
        visible
      }
      updatedAt
    }
  }
`;

export const UPSERT_COMPANY_SETTINGS = gql`
  mutation UpsertCompanySettings($input: UpsertCompanySettingsInput!) {
    upsertCompanySettings(input: $input) {
      _id
      businessName
      accountName
      accountNumber
      bankName
      contactEmail
      contactPhone
      address
      accountInstructions
      promoEnabled
      promoTitle
      promoSubtitle
      promoMessage
      promoImageUrl
      promoCtaLabel
      promoCtaLink
      promoDelaySeconds
      founders {
        name
        title
        bio
        imageUrl
        order
        visible
      }
      updatedAt
    }
  }
`;
