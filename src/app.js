import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ApolloServer, PubSub } from 'apollo-server-express';
import mongose from 'mongoose';

import resolvers from './app/modules/resolvers';
import typeDefs from './app/modules/typeDefs';

const pubsub = new PubSub();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => ({ req, res, pubsub }),
  playground: false,
});

const app = express();
app.use(helmet());

const corsOptionsDelegate = function(req, callback) {
  let corsOptions;
  const whitelist = ['http://localhost:3000'];

  console.log('ORIGIN: ', req.header('Origin'));

  if (whitelist.indexOf(req.header('Origin')) !== -1) {
    callback(null, { origin: true });
  } else {
    callback({ message: 'Not allowed by CORS' }, { origin: false });
  }
};

// app.use(cors(corsOptionsDelegate));
app.use(cors());

// app.use("*", jwtCheck, requireAuth, checkScope);

server.applyMiddleware({ app });

mongose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export default app;
