import { gql } from '@apollo/client';

export const SEND_CONTACT_MESSAGE = gql`
  mutation SendContactMessage(
    $name: String!
    $email: String!
    $subject: String
    $message: String!
  ) {
    sendContactMessage(
      name: $name
      email: $email
      subject: $subject
      message: $message
    )
  }
`;
