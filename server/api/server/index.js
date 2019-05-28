/* eslint max-len:0 */

import { handleAuth, loadExplorer, sendPong } from './transports/http';

import { configureAuth } from './authlayer';
import cors from 'cors';
import express from 'express';
import http from 'http';
import { loadSchemas } from './schemas';

const logger = console;

console.log(process.env.TYPE);
// we only want to run the engine based on these env variables
if (process.env.TYPE != 'both' && process.env.TYPE != 'engine') {
  return
}

try {
  const { API_PORT, MAIL_URL } = process.env;
  const apiPort = API_PORT || 7007;
  const appDb = MongoInternals.defaultRemoteCollectionDriver().mongo.db;

  const schemas = loadSchemas({
    appDb,
    mailUrl: MAIL_URL
  });

  configureAuth({
    secret: 'secret',
    lifetime: '1d'
  });

  const server = http.createServer();
  const app = express();

  // Configurations for CORS
  const corsOptions = { origin: true, credentials: true };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  server.on('request', app);

  app.use('/auth', handleAuth(appDb));
  app.use('/ping', sendPong());
  app.use('/:schema?', loadExplorer('secret', schemas));

  server.listen(apiPort);
  logger.log(`Fetchman started on port: ${apiPort}`);
} catch (ex) {
  console.log('EEEEEE', ex);
  setTimeout(() => {
    throw ex;
  });
}
