require('dotenv').config();

const path = require('path');
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');

const baseDir = process.env.NODE_ENV === 'test'
  ? path.join(process.cwd(), process.env.TEST_FILE_DIR_REL_PATH)
  : process.cwd();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(baseDir, process.env.DB_REL_PATH)
});

const migrator = new Umzug({
  migrations: { glob: ['migrations/*.js', { cwd: __dirname }] },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({
    sequelize,
    modelName: 'migration_meta'
  }),
  logger: console
});

module.exports = {
  sequelize,
  migrator
};
