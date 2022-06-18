const Ajv = require('ajv');
const { ApolloError, UserInputError } = require('apollo-server-express');
const { UniqueConstraintError } = require('sequelize');

const { sequelize } = require('../core');
const { getUserFromJWTHeaders, requireSuperuserPrivileges } = require('../middlewares/auth');
const { Category, categoryValidationSchema } = require('../models/category');
const { Work } = require('../models/work');

const validateCategory = new Ajv().compile(categoryValidationSchema);

module.exports = {
  Query: {
    categories: async () => {
      const categories = await Category.findAll();
      return {
        edges: categories.map((category) => ({ node: category }))
      };
    },
    category: async (parent, { id }) => {
      const category = await Category.findByPk(id);
      if (!category) {
        throw new ApolloError('category_not_found');
      }
      return category;
    }
  },

  Mutation: {
    createCategory: async (parent, { input }, { req }) => {
      if (!validateCategory(input)) {
        throw new UserInputError('invalid');
      }
      const user = await getUserFromJWTHeaders(req);
      requireSuperuserPrivileges(user);

      const { name } = input;
      const category = Category.build({ name });

      try {
        await category.save();
      } catch (e) {
        if (e instanceof UniqueConstraintError) {
          throw new ApolloError('conflict');
        } else {
          throw e;
        }
      }

      return category;
    },
    updateCategory: async (parent, { id, input }, { req }) => {
      if (!validateCategory(input)) {
        throw new UserInputError('invalid');
      }
      const user = await getUserFromJWTHeaders(req);
      requireSuperuserPrivileges(user);

      const { name } = input;
      const category = await Category.findByPk(id);
      if (!category) {
        throw new ApolloError('category_not_found');
      }

      category.name = name;

      try {
        await category.save();
      } catch (e) {
        if (e instanceof UniqueConstraintError) {
          throw new ApolloError('conflict');
        } else {
          throw e;
        }
      }

      return category;
    },
    deleteCategory: async (parent, { id }, { req }) => {
      const user = await getUserFromJWTHeaders(req);
      requireSuperuserPrivileges(user);

      await sequelize.transaction(async (t) => {
        const category = await Category.findByPk(id, {
          attributes: ['id'],
          lock: t.LOCK.UPDATE,
          transaction: t
        });
        if (!category) {
          throw new ApolloError('category_not_found');
        }

        const work = await Work.findOne({
          attributes: ['id'],
          where: {
            categoryId: id
          },
          transaction: t
        });
        if (work) {
          throw new ApolloError('not_empty');
        }

        return category.destroy({ transaction: t });
      });

      return id;
    }
  }
};
