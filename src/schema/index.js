const { gql } = require('graphql-tag');

const categorySchema = require('./category');
const favoriteSchema = require('./favorite');
const userSchema = require('./user');
const workSchema = require('./work');

const linkSchema = gql`
  scalar Upload

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

module.exports = [
  linkSchema,
  userSchema,
  categorySchema,
  workSchema,
  favoriteSchema
];
