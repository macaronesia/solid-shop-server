const Ajv = require('ajv');
const { ApolloError, UserInputError } = require('apollo-server-express');
const { UniqueConstraintError } = require('sequelize');

const { generateAccessToken, getUserFromJWTHeaders } = require('../middlewares/auth');
const { authValidationSchema, User } = require('../models/user');

const validateAuth = new Ajv().compile(authValidationSchema);

module.exports = {
  Query: {
    me: async (parent, args, { req }) => getUserFromJWTHeaders(req)
  },

  Mutation: {
    register: async (parent, { username, password, isSuperuser }) => {
      if (!validateAuth({ username, password })) {
        throw new UserInputError('invalid');
      }

      const user = User.build({
        username,
        isSuperuser: Boolean(isSuperuser)
      });
      await user.savePasswordHash(password);

      try {
        await user.save();
      } catch (e) {
        if (e instanceof UniqueConstraintError) {
          throw new ApolloError('conflict');
        } else {
          throw e;
        }
      }

      return {
        accessToken: generateAccessToken(user),
        user
      };
    },

    login: async (parent, { username, password, superuserRequired }) => {
      if (!validateAuth({ username, password })) {
        throw new UserInputError('invalid');
      }

      const user = await User.findOne({
        where: { username }
      });

      if (!user) {
        throw new ApolloError('user_not_found');
      }

      const valid = await user.validatePassword(password);
      if (!valid) {
        throw new ApolloError('password_incorrect');
      }
      if (superuserRequired && !user.isSuperuser) {
        throw new ApolloError('not_superuser');
      }

      return {
        accessToken: generateAccessToken(user),
        user
      };
    }
  }
};
