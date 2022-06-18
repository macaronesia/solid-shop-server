const { gql } = require('graphql-tag');

module.exports = gql`
  extend type Query {
    myFavorites(page: Int, after: Int): FavoriteConnection!
    isWorkInFavorites(id: Int!): Boolean!
  }

  extend type Mutation {
    addFavorite(id: Int!): Int!
    removeFavorite(id: Int!): Int!
  }

  type FavoriteConnection {
    edges: [FavoriteEdge!]!
    pageInfo: FavoritePageInfo!
  }

  type FavoriteEdge {
    node: Favorite!
  }

  type Favorite {
    id: Int!
    work: Work!
  }

  type FavoritePageInfo {
    hasNextPage: Boolean!
    endCursor: Int
  }
`;
