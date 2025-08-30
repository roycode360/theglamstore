import { gql } from '@apollo/client';

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      email
      role
      emailVerified
    }
  }
`;

export const LOGIN_WITH_GOOGLE = gql`
  mutation LoginWithGoogle($idToken: String!) {
    loginWithGoogle(idToken: $idToken) {
      accessToken
      refreshToken
      user {
        id
        email
        role
      }
    }
  }
`;

export const EXCHANGE_GOOGLE_CODE = gql`
  mutation ExchangeGoogleCode($code: String!, $redirectUri: String!) {
    exchangeGoogleCode(code: $code, redirectUri: $redirectUri) {
      accessToken
      refreshToken
      user {
        id
        email
        role
      }
    }
  }
`;
