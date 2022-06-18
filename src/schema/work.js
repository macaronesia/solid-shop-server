const { gql } = require('graphql-tag');

module.exports = gql`
  extend type Query {
    works(page: Int, after: Int, categoryId: Int): WorkConnection!
    work(id: Int!): Work!
  }

  extend type Mutation {
    createWork(input: WorkInput): Work!
    updateWork(id: Int!, input: WorkInput): Work!
    deleteWork(id: Int!): Int!
  }

  extend type Subscription {
    workCreated: Work!
  }

  type WorkConnection {
    edges: [WorkEdge!]!
    pageInfo: WorkPageInfo!
  }

  type WorkEdge {
    node: Work!
  }

  type Work {
    id: Int!
    title: String!
    category: Category!
    modelFilename: String!
    coverFilename: String!
  }

  type WorkPageInfo {
    hasNextPage: Boolean!
    endCursor: Int
  }

  input WorkInput {
    title: String!
    categoryId: Int!
    modelFile: Upload
    modelFilename: String
    coverFile: Upload
    coverFilename: String
  }
`;
