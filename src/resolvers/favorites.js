const { ApolloError } = require('apollo-server-express');
const { Op } = require('sequelize');

const { sequelize } = require('../core');
const { getUserFromJWTHeaders } = require('../middlewares/auth');
const { Favorite } = require('../models/favorite');
const { Work } = require('../models/work');

const NUM_WORKS_PER_PAGE = 10;

module.exports = {
  Query: {
    myFavorites: async (parent, { page, after }, { req }) => {
      const user = await getUserFromJWTHeaders(req);

      const conditions = {
        userId: user.id
      };
      const findArgs = {
        where: conditions,
        limit: NUM_WORKS_PER_PAGE + 1,
        order: [
          ['id', 'DESC']
        ]
      };
      if (page > 0) {
        findArgs.offset = NUM_WORKS_PER_PAGE * (page - 1);
      } else if (after > 0) {
        conditions.id = {
          [Op.lt]: after
        };
      }
      const favorites = await Favorite.findAll(findArgs);
      const hasNextPage = favorites.length === NUM_WORKS_PER_PAGE + 1;
      return {
        edges: favorites.slice(0, NUM_WORKS_PER_PAGE).map((favorite) => ({ node: favorite })),
        pageInfo: {
          hasNextPage,
          ...(hasNextPage ? { endCursor: favorites.at(-2).id } : {})
        }
      };
    },
    isWorkInFavorites: async (parent, { id }, { req }) => {
      const user = await getUserFromJWTHeaders(req);

      const favorite = await Favorite.findOne({
        attributes: ['id'],
        where: {
          userId: user.id,
          workId: id
        }
      });

      return Boolean(favorite);
    }
  },

  Mutation: {
    addFavorite: async (parent, { id }, { req }) => {
      const user = await getUserFromJWTHeaders(req);

      await sequelize.transaction(async (t) => {
        const work = await Work.findByPk(id, {
          attributes: ['id'],
          lock: t.LOCK.UPDATE,
          transaction: t
        });
        if (!work) {
          throw new ApolloError('work_not_found');
        }

        return Favorite.create({
          userId: user.id,
          workId: work.id
        }, { transaction: t });
      });

      return id;
    },
    removeFavorite: async (parent, { id }, { req }) => {
      const user = await getUserFromJWTHeaders(req);

      await Favorite.destroy({
        where: {
          userId: user.id,
          workId: id
        }
      });

      return id;
    }
  },

  Favorite: {
    work: async (favorite) => Work.loader.load(favorite.workId)
  }
};
