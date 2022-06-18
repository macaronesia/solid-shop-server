require('dotenv').config();
require('dayjs').extend(require('dayjs/plugin/duration'));

const fs = require('fs');

const {
  COVER_FILE_DIR,
  MODEL_FILE_DIR,
  PORT
} = require('./config');
const { startApolloServer } = require('./server');

if (!fs.existsSync(MODEL_FILE_DIR)) {
  fs.mkdirSync(MODEL_FILE_DIR, { recursive: true });
}

if (!fs.existsSync(COVER_FILE_DIR)) {
  fs.mkdirSync(COVER_FILE_DIR, { recursive: true });
}

startApolloServer(PORT);
