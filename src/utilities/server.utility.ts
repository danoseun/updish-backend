import Debug from 'debug';
import { createServer, Server } from 'http';
import { Express } from 'express';

import { logger } from './logger.utility';

export const createServerInstance = (port: number, serverName: string, app: Express): Server => {
  const debug = Debug(serverName);
  const server = createServer(app);

  app.set('port', port);

  function onError(error: any): any {
    if (error.syscall !== 'listen') {
      throw error;
    }

    switch (error.code) {
      case 'EACCES':
        logger.error(`${port} requires elevated privileges`);
        process.exit(1);
      case 'EADDRINUSE':
        logger.error(`${port} is already in use`);
        process.exit(1);
      default:
        throw error;
    }
  }

  function onListening(): void {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
    debug(`Listening on ${bind}`);
    logger.info(`Listening on ${bind}`);
    console.log(`Listening on port ${port}`)
  }

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);

  return server;
};
