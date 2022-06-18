require('dotenv').config();
require('dayjs').extend(require('dayjs/plugin/duration'));

const bcrypt = require('bcrypt');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const uuid = require('uuid');

const {
  COVER_FILE_DIR,
  MODEL_FILE_DIR,
  PASSWORD_SALT_ROUNDS
} = require('../src/config');
const { migrator, sequelize } = require('./umzug');

if (!fs.existsSync(MODEL_FILE_DIR)) {
  fs.mkdirSync(MODEL_FILE_DIR, { recursive: true });
}

if (!fs.existsSync(COVER_FILE_DIR)) {
  fs.mkdirSync(COVER_FILE_DIR, { recursive: true });
}

const downloadFile = (url, dest, resolve, reject) => {
  let proto;
  if (url.startsWith('http:')) {
    proto = http;
  } else if (url.startsWith('https:')) {
    proto = https;
  } else {
    throw new Error('Mismatched URL scheme');
  }

  const file = fs.createWriteStream(dest);

  const request = proto.get(url, (response) => {
    if (response.statusCode !== 200) {
      reject(`Response status was ${response.statusCode}`);
    }
    response.pipe(file);
  });

  file.on('finish', () => file.close(resolve));

  request.on('error', (err) => {
    fs.unlink(dest, () => {
      reject(err.message);
    });
  });

  file.on('error', (err) => {
    fs.unlink(dest, () => {
      reject(err.message);
    });
  });
};

const createData = async () => {
  const users = [
    { 'id': 1, 'username': 'demo', 'password': await bcrypt.hash('demo', PASSWORD_SALT_ROUNDS), 'is_superuser': true }
  ];

  const categories = [
    { 'id': 1, 'name': 'Showcase' },
    { 'id': 2, 'name': 'Standard' },
    { 'id': 3, 'name': 'Feature Tests' },
    { 'id': 4, 'name': 'Minimal Tests' }
  ];

  const works = [
    { 'id': 1, 'category_id': 1, 'title': 'Avocado', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/screenshot/screenshot.jpg' },
    { 'id': 2, 'category_id': 1, 'title': 'Barramundi Fish', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF-Binary/BarramundiFish.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/screenshot/screenshot.jpg' },
    { 'id': 3, 'category_id': 1, 'title': 'Boom Box', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/screenshot/screenshot.jpg' },
    { 'id': 4, 'category_id': 1, 'title': 'Corset', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Corset/glTF-Binary/Corset.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Corset/screenshot/screenshot.jpg' },
    { 'id': 5, 'category_id': 1, 'title': 'Damaged Helmet', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/screenshot/screenshot.png' },
    { 'id': 6, 'category_id': 1, 'title': 'Lantern', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/screenshot/screenshot.jpg' },
    { 'id': 7, 'category_id': 1, 'title': 'Water Bottle', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/screenshot/screenshot.jpg' },
    { 'id': 8, 'category_id': 2, 'title': 'Box', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/screenshot/screenshot.png' },
    { 'id': 9, 'category_id': 2, 'title': 'Box Textured', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF-Binary/BoxTextured.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/screenshot/screenshot.png' },
    { 'id': 10, 'category_id': 2, 'title': 'Box Vertex Colors', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxVertexColors/glTF-Binary/BoxVertexColors.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxVertexColors/screenshot/screenshot.png' },
    { 'id': 11, 'category_id': 2, 'title': '2 Cylinder Engine', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/2CylinderEngine/glTF-Binary/2CylinderEngine.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/2CylinderEngine/screenshot/screenshot.png' },
    { 'id': 12, 'category_id': 2, 'title': 'Reciprocating Saw', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ReciprocatingSaw/glTF-Binary/ReciprocatingSaw.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ReciprocatingSaw/screenshot/screenshot.png' },
    { 'id': 13, 'category_id': 2, 'title': 'Gearbox Assy', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/screenshot/screenshot.png' },
    { 'id': 14, 'category_id': 2, 'title': 'Buggy', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/glTF-Binary/Buggy.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/screenshot/screenshot.png' },
    { 'id': 15, 'category_id': 2, 'title': 'Cesium Milk Truck', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/screenshot/screenshot.gif' },
    { 'id': 16, 'category_id': 2, 'title': 'Fox', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/screenshot/screenshot.jpg' },
    { 'id': 17, 'category_id': 3, 'title': 'Metal Rough Spheres (Textureless)', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MetalRoughSpheresNoTextures/glTF-Binary/MetalRoughSpheresNoTextures.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MetalRoughSpheresNoTextures/screenshot/screenshot.png' },
    { 'id': 18, 'category_id': 3, 'title': 'Orientation Test', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/OrientationTest/glTF-Binary/OrientationTest.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/OrientationTest/screenshot/screenshot.png' },
    { 'id': 19, 'category_id': 3, 'title': 'Recursive Skeletons', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RecursiveSkeletons/glTF-Binary/RecursiveSkeletons.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RecursiveSkeletons/screenshot/screenshot.jpg' },
    { 'id': 20, 'category_id': 4, 'title': 'Unicode Test', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Unicode%E2%9D%A4%E2%99%BBTest/glTF-Binary/Unicode%E2%9D%A4%E2%99%BBTest.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Unicode%E2%9D%A4%E2%99%BBTest/screenshot/screenshot.png' },
    { 'id': 21, 'category_id': 3, 'title': 'SpecGloss Vs MetalRough', 'model_filename': uuid.v4(), 'cover_filename': uuid.v4(), 'modelUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SpecGlossVsMetalRough/glTF-Binary/SpecGlossVsMetalRough.glb', 'coverUrl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SpecGlossVsMetalRough/screenshot/screenshot-large.jpg' }
  ];

  console.log('Downloading files...');

  await Promise.all(works.flatMap((work) => [
    new Promise((resolve, reject) => {
      downloadFile(work.modelUrl, path.join(MODEL_FILE_DIR, work['model_filename']), resolve, reject);
    }),
    new Promise((resolve, reject) => {
      downloadFile(work.coverUrl, path.join(COVER_FILE_DIR, work['cover_filename']), resolve, reject);
    })
  ]));

  console.log('All files have been downloaded.');

  await migrator.down({ to: 0 });
  await migrator.up();

  await sequelize.getQueryInterface().bulkInsert('users', users);
  await sequelize.getQueryInterface().bulkInsert('categories', categories);
  await sequelize.getQueryInterface().bulkInsert('works', works.map((work) => {
    const { modelUrl, coverUrl, ...rest } = work;
    return rest;
  }));
};

if (require.main === module) {
  createData();
}
