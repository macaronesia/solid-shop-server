const { gql } = require('graphql-tag');

module.exports = gql`
  extend type Query {
    me: User
  }

  extend type Mutation {
    register(username: String!, password: String!, isSuperuser: Boolean): AuthPayload!
    login(username: String!, password: String!, superuserRequired: Boolean): AuthPayload!
  }

  type AuthPayload {
    accessToken: String!
    user: User!
  }

  type User {
    username: String!
  }
`;
