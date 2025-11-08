import { gql } from '@apollo/client';

export const LOGIN_WITH_AUTH0 = gql`
  mutation LoginWithAuth0($auth0Token: String!) {
    loginWithAuth0(auth0Token: $auth0Token) {
      accessToken
      refreshToken
      user {
        _id
        fullName
        email
        role
        avatar
        emailVerified
        createdAt
        updatedAt
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const ME = gql`
  query Me {
    me {
      _id
      fullName
      email
      avatar
      role
      emailVerified
      createdAt
      updatedAt
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
