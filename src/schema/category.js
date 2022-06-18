const { gql } = require('graphql-tag');

module.exports = gql`
  extend type Query {
    categories: CategoryConnection!
    category(id: Int!): Category!
  }

  extend type Mutation {
    createCategory(input: CategoryInput): Category!
    updateCategory(id: Int!, input: CategoryInput): Category!
    deleteCategory(id: Int!): Int!
  }

  type CategoryConnection {
    edges: [CategoryEdge!]!
  }

  type CategoryEdge {
    node: Category!
  }

  type Category {
    id: Int!
    name: String!
  }

  input CategoryInput {
    name: String!
  }
`;
