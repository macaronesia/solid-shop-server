const Ajv = require('ajv');
const { ApolloError, UserInputError } = require('apollo-server-express');
const { createWriteStream, existsSync } = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { finished } = require('stream/promises');
const uuid = require('uuid');

const {
  COVER_FILE_DIR,
  MODEL_FILE_DIR,
  NUM_WORKS_PER_PAGE
} = require('../config');
const { WORK_CREATED } = require('../constants/eventNames');
const { pubsub, sequelize } = require('../core');
const { getUserFromJWTHeaders, requireSuperuserPrivileges } = require('../middlewares/auth');
const { Category } = require('../models/category');
const { Favorite } = require('../models/favorite');
const { Work, workValidationSchema } = require('../models/work');

const validateWork = new Ajv().compile(workValidationSchema);

module.exports = {
  Query: {
    works: async (parent, { page, after, categoryId }) => {
      const conditions = {};
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
      if (categoryId) {
        conditions.categoryId = categoryId;
      }
      const works = await Work.findAll(findArgs);
      const hasNextPage = works.length === NUM_WORKS_PER_PAGE + 1;
      return {
        edges: works.slice(0, NUM_WORKS_PER_PAGE).map((work) => ({ node: work })),
        pageInfo: {
          hasNextPage,
          ...(hasNextPage ? { endCursor: works.at(-2).id } : {})
        }
      };
    },
    work: async (parent, { id }) => {
      const work = await Work.findByPk(id);
      if (!work) {
        throw new ApolloError('category_not_found');
      }
      return work;
    }
  },

  Mutation: {
    createWork: async (parent, { input }, { req }) => {
      if (!validateWork(input)) {
        throw new UserInputError('invalid');
      }
      const user = await getUserFromJWTHeaders(req);
      requireSuperuserPrivileges(user);

      const {
        title,
        categoryId,
        modelFile,
        coverFile
      } = input;
      let {
        modelFilename,
        coverFilename
      } = input;

      if (modelFile) {
        const { createReadStream: createModelReadStream } = await modelFile;
        const modelStream = createModelReadStream();
        modelFilename = uuid.v4();
        const modelOut = createWriteStream(path.join(MODEL_FILE_DIR, modelFilename));
        modelStream.pipe(modelOut);
        await finished(modelOut);
      } else {
        if (!existsSync(path.join(MODEL_FILE_DIR, modelFilename))) {
          throw new ApolloError('model_file_not_found');
        }
      }

      if (coverFile) {
        const { createReadStream: createCoverReadStream } = await coverFile;
        const coverStream = createCoverReadStream();
        coverFilename = uuid.v4();
        const coverOut = createWriteStream(path.join(COVER_FILE_DIR, coverFilename));
        coverStream.pipe(coverOut);
        await finished(coverOut);
      } else {
        if (!existsSync(path.join(COVER_FILE_DIR, coverFilename))) {
          throw new ApolloError('cover_file_not_found');
        }
      }

      const work = await sequelize.transaction(async (t) => {
        const category = await Category.findByPk(categoryId, {
          attributes: ['id'],
          lock: t.LOCK.UPDATE,
          transaction: t
        });
        if (!category) {
          throw new ApolloError('category_not_found');
        }

        return Work.create({
          title,
          categoryId: category.id,
          modelFilename,
          coverFilename
        }, { transaction: t });
      });

      pubsub.publish(WORK_CREATED, { workId: work.id });

      return work;
    },
    updateWork: async (parent, { id, input }, { req }) => {
      if (!validateWork(input)) {
        throw new UserInputError('invalid');
      }
      const user = await getUserFromJWTHeaders(req);
      requireSuperuserPrivileges(user);

      const {
        title,
        categoryId,
        modelFile,
        coverFile
      } = input;
      let {
        modelFilename,
        coverFilename
      } = input;

      const work = await Work.findByPk(id);
      if (!work) {
        throw new ApolloError('work_not_found');
      }

      if (modelFile) {
        const { createReadStream: createModelReadStream } = await modelFile;
        const modelStream = createModelReadStream();
        modelFilename = uuid.v4();
        const modelOut = createWriteStream(path.join(MODEL_FILE_DIR, modelFilename));
        modelStream.pipe(modelOut);
        await finished(modelOut);
      } else {
        if (!existsSync(path.join(MODEL_FILE_DIR, modelFilename))) {
          throw new ApolloError('model_file_not_found');
        }
      }

      if (coverFile) {
        const { createReadStream: createCoverReadStream } = await coverFile;
        const coverStream = createCoverReadStream();
        coverFilename = uuid.v4();
        const coverOut = createWriteStream(path.join(COVER_FILE_DIR, coverFilename));
        coverStream.pipe(coverOut);
        await finished(coverOut);
      } else {
        if (!existsSync(path.join(COVER_FILE_DIR, coverFilename))) {
          throw new ApolloError('cover_file_not_found');
        }
      }

      return sequelize.transaction(async (t) => {
        const category = await Category.findByPk(categoryId, {
          attributes: ['id'],
          lock: t.LOCK.UPDATE,
          transaction: t
        });
        if (!category) {
          throw new ApolloError('category_not_found');
        }

        work.title = title;
        work.categoryId = category.id;
        work.modelFilename = modelFilename;
        work.coverFilename = coverFilename;

        return work.save({
          transaction: t
        });
      });
    },
    deleteWork: async (parent, { id }, { req }) => {
      const user = await getUserFromJWTHeaders(req);
      requireSuperuserPrivileges(user);

      await sequelize.transaction(async (t) => {
        await Work.destroy({
          where: {
            id
          }
        }, { transaction: t });
        await Favorite.destroy({
          where: {
            workId: id
          }
        }, { transaction: t });
      });

      return id;
    }
  },

  Subscription: {
    workCreated: {
      resolve: async (payload) => Work.findByPk(payload.workId),
      subscribe: () => pubsub.asyncIterator(WORK_CREATED)
    }
  },

  Work: {
    category: async (work) => Category.loader.load(work.categoryId)
  }
};
