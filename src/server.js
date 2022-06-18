const { makeExecutableSchema } = require('@graphql-tools/schema');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const express = require('express');
const { graphqlUploadExpress } = require('graphql-upload');
const { useServer } = require('graphql-ws/lib/use/ws');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');

const {
  CORS_ORIGIN,
  COVER_FILE_DIR,
  MODEL_FILE_DIR
} = require('./config');
const resolvers = require('./resolvers');
const typeDefs = require('./schema');

const startApolloServer = async (port) => {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const app = express();
  app.use(cors({ origin: CORS_ORIGIN }));
  app.use(graphqlUploadExpress());
  app.use('/uploaded/models', express.static(MODEL_FILE_DIR));
  app.use('/uploaded/covers', express.static(COVER_FILE_DIR));
  const httpServer = createServer(app);
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  });
  const serverCleanup = useServer({ schema }, wsServer);
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => ({
      req
    }),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            }
          };
        }
      }
    ]
  });
  await server.start();
  server.applyMiddleware({ app });
  await new Promise((resolve) => {
    httpServer.listen(port, resolve);
  });
  return server;
};

module.exports = {
  startApolloServer
};
