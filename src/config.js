const dayjs = require('dayjs');
const path = require('path');

const baseDir = process.env.NODE_ENV === 'test'
  ? path.join(process.cwd(), process.env.TEST_FILE_DIR_REL_PATH)
  : process.cwd();
const MODEL_FILE_DIR = path.join(baseDir, process.env.MODEL_FILE_DIR_REL_PATH);
const COVER_FILE_DIR = path.join(baseDir, process.env.COVER_FILE_DIR_REL_PATH);

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 4000,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  DB_PARAMS: {
    dialect: 'sqlite',
    storage: path.join(baseDir, process.env.DB_REL_PATH)
  },
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ACCESS_TOKEN_EXPIRES: dayjs.duration({ minutes: 15 }),
  PASSWORD_SALT_ROUNDS: 12,
  MODEL_FILE_DIR,
  COVER_FILE_DIR,
  NUM_WORKS_PER_PAGE: 10
};
