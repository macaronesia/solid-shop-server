require('dotenv').config();
require('dayjs').extend(require('dayjs/plugin/duration'));

const { faker } = require('@faker-js/faker');
const path = require('path');
const request = require('supertest');

const { migrator } = require('../db/umzug');
const {
  NUM_WORKS_PER_PAGE,
  PORT
} = require('../src/config');
const { startApolloServer } = require('../src/server');

const createUser = () => ({
  username: faker.internet.userName(),
  password: faker.internet.password()
});

const createCategory = () => ({
  name: faker.commerce.department()
});

const createWork = ({ categoryId }) => ({
  title: faker.commerce.productName(),
  categoryId
});

describe('e2e', () => {
  let server;
  let url;
  let modelUrlPath;
  let coverUrlPath;

  const superuser = createUser();
  let superuserToken;
  const user = createUser();
  let userToken;
  let categories = [...Array(4)].map(() => createCategory());
  let works;

  beforeAll(async () => {
    await migrator.up();
    server = await startApolloServer(PORT);
    url = `http://localhost:${PORT}${server.graphqlPath}`;
    modelUrlPath = `http://localhost:${PORT}/uploaded/models`;
    coverUrlPath = `http://localhost:${PORT}/uploaded/covers`;
  });

  afterAll(async () => {
    await server.stop();
    await migrator.down({ to: 0 });
  });

  test('register a superuser', async () => {
    const query = `
      mutation Register($username: String!, $password: String!) {
        register(username: $username, password: $password, isSuperuser: true) {
          accessToken
          user {
            username
          }
        }
      }
    `;
    const response = await request(url).post('/').send({
      query,
      variables: {
        username: superuser.username,
        password: superuser.password
      }
    });
    const data = response.body.data;
    expect(typeof data.register.accessToken).toBe('string');
    superuserToken = data.register.accessToken;
    expect(data.register.user).toEqual({ username: superuser.username });
  });

  test('register a plain user', async () => {
    const query = `
      mutation Register($username: String!, $password: String!) {
        register(username: $username, password: $password) {
          accessToken
          user {
            username
          }
        }
      }
    `;
    const response = await request(url).post('/').send({
      query,
      variables: {
        username: user.username,
        password: user.password
      }
    });
    const data = response.body.data;
    expect(typeof data.register.accessToken).toBe('string');
    expect(data.register.user).toEqual({ username: user.username });
  });

  test('try to register a user with the same username', async () => {
    const query = `
      mutation Register($username: String!, $password: String!) {
        register(username: $username, password: $password) {
          accessToken
          user {
            username
          }
        }
      }
    `;
    const response = await request(url).post('/').send({
      query,
      variables: {
        username: user.username,
        password: user.password
      }
    });
    expect(response.body.errors[0].message).toBe('conflict');
  });

  test('login a user', async () => {
    const query = `
      mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          accessToken
          user {
            username
          }
        }
      }
    `;
    const response = await request(url).post('/').send({
      query,
      variables: {
        username: user.username,
        password: user.password
      }
    });
    const data = response.body.data;
    expect(typeof data.login.accessToken).toBe('string');
    userToken = data.login.accessToken;
    expect(data.login.user).toEqual({ username: user.username });
  });

  test('create categories', async () => {
    const query = `
      mutation CreateCategory($name: String!) {
        createCategory(input: {name: $name}) {
          id
          name
        }
      }
    `;
    for (let i = 0, response; i < categories.length; i += 1) {
      response = await request(url)
        .post('/')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send({
          query,
          variables: {
            name: categories[i].name
          }
        });
      const data = response.body.data;
      expect(typeof data.createCategory.id).toBe('number');
      categories[i].id = data.createCategory.id;
      expect(data.createCategory.name).toBe(categories[i].name);
    }
  });

  test('try to create a category with the same name', async () => {
    const query = `
      mutation CreateCategory($name: String!) {
        createCategory(input: {name: $name}) {
          id
          name
        }
      }
    `;
    const response = await request(url)
      .post('/')
      .set('Authorization', `Bearer ${superuserToken}`)
      .send({
        query,
        variables: {
          name: categories[1].name
        }
      });
    expect(response.body.errors[0].message).toBe('conflict');
  });

  test('update a category', async () => {
    const thatCategory = categories[1];
    thatCategory.name = faker.commerce.department();
    const query = `
      mutation UpdateCategory($id: Int!, $name: String!) {
        updateCategory(id: $id, input: {name: $name}) {
          id
          name
        }
      }
    `;
    const response = await request(url)
      .post('/')
      .set('Authorization', `Bearer ${superuserToken}`)
      .send({
        query,
        variables: {
          id: thatCategory.id,
          name: thatCategory.name
        }
      });
    const data = response.body.data;
    expect(data.updateCategory.name).toBe(thatCategory.name);
  });

  test('get a category', async () => {
    const thatCategory = categories[1];
    const query = `
      query Category($id: Int!) {
        category(id: $id) {
          id
          name
        }
      }
    `;
    const response = await request(url)
      .post('/')
      .send({
        query,
        variables: {
          id: thatCategory.id
        }
      });
    const data = response.body.data;
    expect(data.category.name).toBe(thatCategory.name);
  });

  test('create works', async () => {
    works = categories.reduce(
      (total, category) => total.concat(
        [...Array(5)].map(() => createWork({ categoryId: category.id }))
      ),
      []
    );

    const query = `
      mutation CreateWork(
          $title: String!,
          $categoryId: Int!,
          $modelFile: Upload!,
          $coverFile: Upload!) {
        createWork(input: {
            title: $title,
            categoryId: $categoryId,
            modelFile: $modelFile,
            coverFile: $coverFile
        }) {
          id
          title
          category {
            id
            name
          }
          modelFilename
          coverFilename
        }
      }
    `;
    for (let i = 0, response, fileResponse; i < works.length; i += 1) {
      response = await request(url)
        .post('/')
        .set('Authorization', `Bearer ${superuserToken}`)
        .field('operations', JSON.stringify({
          query,
          variables: {
            title: works[i].title,
            categoryId: works[i].categoryId,
            modelFile: null,
            coverFile: null
          }
        }))
        .field('map', JSON.stringify({
          '1': ['variables.modelFile'],
          '2': ['variables.coverFile']
        }))
        .attach('1', path.join(process.cwd(), 'test/fixtures/sample1.glb'))
        .attach('2', path.join(process.cwd(), 'test/fixtures/sample1.png'));
      const data = response.body.data;
      expect(typeof data.createWork.id).toBe('number');
      works[i].id = data.createWork.id;
      expect(data.createWork.title).toBe(works[i].title);
      expect(data.createWork.category.id).toBe(works[i].categoryId);
      works[i].modelFilename = data.createWork.modelFilename;
      fileResponse = await request(modelUrlPath).get(`/${data.createWork.modelFilename}`);
      expect(fileResponse.status).toBe(200);
      works[i].coverFilename = data.createWork.coverFilename;
      fileResponse = await request(coverUrlPath).get(`/${data.createWork.coverFilename}`);
      expect(fileResponse.status).toBe(200);
    }
  });

  test('update a work', async () => {
    let fileResponse;
    const thatWork = works[1];
    thatWork.title = faker.commerce.productName();
    thatWork.categoryId = 2;
    const query = `
      mutation UpdateWork(
          $id: Int!,
          $title: String!,
          $categoryId: Int!,
          $modelFile: Upload,
          $modelFilename: String,
          $coverFile: Upload,
          $coverFilename: String) {
        updateWork(id: $id, input: {
            title: $title,
            categoryId: $categoryId,
            modelFile: $modelFile,
            modelFilename: $modelFilename,
            coverFile: $coverFile,
            coverFilename: $coverFilename
        }) {
          id
          title
          category {
            id
            name
          }
          modelFilename
          coverFilename
        }
      }
    `;
    const response = await request(url)
      .post('/')
      .set('Authorization', `Bearer ${superuserToken}`)
      .field('operations', JSON.stringify({
        query,
        variables: {
          id: thatWork.id,
          title: thatWork.title,
          categoryId: thatWork.categoryId,
          modelFile: null,
          coverFile: null
        }
      }))
      .field('map', JSON.stringify({
        '1': ['variables.modelFile'],
        '2': ['variables.coverFile']
      }))
      .attach('1', path.join(process.cwd(), 'test/fixtures/sample2.glb'))
      .attach('2', path.join(process.cwd(), 'test/fixtures/sample2.png'));
    const data = response.body.data;
    expect(data.updateWork.title).toBe(thatWork.title);
    expect(data.updateWork.category.id).toBe(thatWork.categoryId);
    expect(data.updateWork.modelFilename).not.toBe(thatWork.modelFilename);
    thatWork.modelFilename = data.updateWork.modelFilename;
    fileResponse = await request(modelUrlPath).get(`/${data.updateWork.modelFilename}`);
    expect(fileResponse.status).toBe(200);
    expect(data.updateWork.coverFilename).not.toBe(thatWork.coverFilename);
    thatWork.coverFilename = data.updateWork.coverFilename;
    fileResponse = await request(coverUrlPath).get(`/${data.updateWork.coverFilename}`);
    expect(fileResponse.status).toBe(200);
  });

  test('get a work', async () => {
    const thatWork = works[1];
    const query = `
      query Work($id: Int!) {
        work(id: $id) {
          id
          title
          category {
            id
            name
          }
          modelFilename
          coverFilename
        }
      }
    `;
    const response = await request(url)
      .post('/')
      .send({
        query,
        variables: {
          id: thatWork.id
        }
      });
    const data = response.body.data;
    expect(data.work.title).toBe(thatWork.title);
    expect(data.work.category.id).toBe(thatWork.categoryId);
    expect(data.work.modelFilename).toBe(thatWork.modelFilename);
    expect(data.work.coverFilename).toBe(thatWork.coverFilename);
  });

  test('list works belonging to a specified category', async () => {
    const thatWork = works[1];
    const query = `
      query Works($categoryId: Int!) {
        works(categoryId: $categoryId) {
          edges {
            node {
              id
              title
              modelFilename
              coverFilename
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;
    const response = await request(url)
      .post('/')
      .send({
        query,
        variables: {
          categoryId: thatWork.categoryId
        }
      });
    const data = response.body.data;
    expect(data.works.pageInfo.hasNextPage).toBe(false);
    expect(data.works.edges.map((edge) => edge.node))
      .toEqual(works
        .filter((work) => work.categoryId === thatWork.categoryId)
        .reverse()
        .map((work) => ({
          id: work.id,
          title: work.title,
          modelFilename: work.modelFilename,
          coverFilename: work.coverFilename
        })));
  });

  test('add a favorite', async () => {
    const thatWork = works[1];
    const query = `
      mutation AddFavorite($id: Int!) {
        addFavorite(id: $id)
      }
    `;
    const response = await request(url)
      .post('/')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        query,
        variables: {
          id: thatWork.id
        }
      });
    const data = response.body.data;
    expect(data.addFavorite).toBe(thatWork.id);
  });

  test('check if the favorite exists', async () => {
    const thatWork = works[1];
    const query = `
      query CheckFavorite($id: Int!) {
        isWorkInFavorites(id: $id)
      }
    `;
    const response = await request(url)
      .post('/')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        query,
        variables: {
          id: thatWork.id
        }
      });
    const data = response.body.data;
    expect(data.isWorkInFavorites).toBe(true);
  });

  test('remove a favorite', async () => {
    const thatWork = works[1];
    const query = `
      mutation RemoveFavorite($id: Int!) {
        removeFavorite(id: $id)
      }
    `;
    const response = await request(url)
      .post('/')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        query,
        variables: {
          id: thatWork.id
        }
      });
    const data = response.body.data;
    expect(data.removeFavorite).toBe(thatWork.id);
  });

  test('check if the favorite has been removed', async () => {
    const thatWork = works[1];
    const query = `
      query CheckFavorite($id: Int!) {
        isWorkInFavorites(id: $id)
      }
    `;
    const response = await request(url)
      .post('/')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        query,
        variables: {
          id: thatWork.id
        }
      });
    const data = response.body.data;
    expect(data.isWorkInFavorites).toBe(false);
  });

  test('try to delete a category which some works still belong to', async () => {
    const thatCategory = categories[1];
    const query = `
      mutation DeleteCategory($id: Int!) {
        deleteCategory(id: $id)
      }
    `;
    const response = await request(url)
      .post('/')
      .set('Authorization', `Bearer ${superuserToken}`)
      .send({
        query,
        variables: {
          id: thatCategory.id
        }
      });
    expect(response.body.errors[0].message).toBe('not_empty');
  });

  test('delete all the works belonging to that category', async () => {
    const thoseWorks = works.filter((work) => work.categoryId === categories[1].id);
    const query = `
      mutation DeleteWork($id: Int!) {
        deleteWork(id: $id)
      }
    `;
    for (let i = 0, response; i < thoseWorks.length; i += 1) {
      response = await request(url)
        .post('/')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send({
          query,
          variables: {
            id: thoseWorks[i].id
          }
        });
      const data = response.body.data;
      expect(data.deleteWork).toBe(thoseWorks[i].id);
      works = works.filter((work) => !thoseWorks.includes(work));
    }
  });

  test('list all works with pagination parameters', async () => {
    const sequenceNumber = 1;
    const thatWork = works.at(-sequenceNumber);
    const query = `
      query Works($after: Int!) {
        works(after: $after) {
          edges {
            node {
              id
              title
              modelFilename
              coverFilename
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
    const response = await request(url)
      .post('/')
      .send({
        query,
        variables: {
          after: thatWork.id
        }
      });
    const data = response.body.data;
    expect(data.works.pageInfo.hasNextPage).toBe(true);
    expect(data.works.edges.map((edge) => edge.node))
      .toEqual(works
        .slice()
        .reverse()
        .slice(sequenceNumber, sequenceNumber + NUM_WORKS_PER_PAGE)
        .map((work) => ({
          id: work.id,
          title: work.title,
          modelFilename: work.modelFilename,
          coverFilename: work.coverFilename
        })));
  });

  test('delete an empty category', async () => {
    const thatCategory = categories[1];
    const query = `
      mutation DeleteCategory($id: Int!) {
        deleteCategory(id: $id)
      }
    `;
    const response = await request(url)
      .post('/')
      .set('Authorization', `Bearer ${superuserToken}`)
      .send({
        query,
        variables: {
          id: thatCategory.id
        }
      });
    const data = response.body.data;
    expect(data.deleteCategory).toBe(thatCategory.id);
    categories = categories.filter((category) => category.id !== thatCategory.id);
  });

  test('list all categories', async () => {
    const query = `
      query Categories {
        categories {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `;
    const response = await request(url)
      .post('/')
      .send({
        query
      });
    const data = response.body.data;
    expect(data.categories.edges.map((edge) => edge.node))
      .toEqual(categories
        .map((category) => ({
          id: category.id,
          name: category.name
        })));
  });
});
