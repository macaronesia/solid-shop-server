require('dotenv').config();

const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), process.env.TEST_FILE_DIR_REL_PATH);
const MODEL_FILE_DIR = path.join(baseDir, process.env.MODEL_FILE_DIR_REL_PATH);
const COVER_FILE_DIR = path.join(baseDir, process.env.COVER_FILE_DIR_REL_PATH);

beforeAll(() => {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  if (!fs.existsSync(MODEL_FILE_DIR)) {
    fs.mkdirSync(MODEL_FILE_DIR, { recursive: true });
  }

  if (!fs.existsSync(COVER_FILE_DIR)) {
    fs.mkdirSync(COVER_FILE_DIR, { recursive: true });
  }
});

afterAll(() => {
  fs.rmSync(COVER_FILE_DIR, { recursive: true, force: true });
  fs.rmSync(MODEL_FILE_DIR, { recursive: true, force: true });
  fs.rmSync(baseDir, { recursive: true, force: true });
});
