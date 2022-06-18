const { PubSub } = require('graphql-subscriptions');
const Sequelize = require('sequelize');

const {
  DB_PARAMS
} = require('./config');

const sequelize = new Sequelize(DB_PARAMS);
const pubsub = new PubSub();

module.exports = {
  sequelize,
  pubsub
};
