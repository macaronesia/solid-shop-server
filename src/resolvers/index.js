const { GraphQLUpload } = require('graphql-upload');

const categoryResolvers = require('./category');
const favoritesResolvers = require('./favorites');
const userResolvers = require('./user');
const workResolvers = require('./work');

module.exports = [
  { Upload: GraphQLUpload },
  userResolvers,
  categoryResolvers,
  workResolvers,
  favoritesResolvers
];
