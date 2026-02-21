import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { database } from './config/database';
import { logger } from './utils/logger';

let server: http.Server | null = null;
let isShuttingDown = false;

async function startServer(): Promise<void> {
  try {
    logger.info('Starting microservice...');

    await database.initialize();

    const app = createApp();

    server = http.createServer(app);

    server.listen(config.port, () => {
      logger.info(
        {
          port: config.port,
          environment: config.nodeEnv,
        },
        `Server started and listening on port ${config.port}`
      );
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.fatal({ port: config.port }, `Port ${config.port} is already in use`);
        process.exit(1);
      } else {
        logger.fatal({ error }, 'Server error');
        throw error;
      }
    });

    setupGracefulShutdown();
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

function setupGracefulShutdown(): void {
  const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

  shutdownSignals.forEach((signal) => {
    process.on(signal, () => gracefulShutdown(signal));
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection');
    gracefulShutdown('unhandledRejection');
  });
}

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress');
    return;
  }

  isShuttingDown = true;
  logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown...');

  const shutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 30000);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) {
            logger.error({ error: err }, 'Error closing HTTP server');
            reject(err);
          } else {
            logger.info('HTTP server closed');
            resolve();
          }
        });
      });
    }

    await database.close();

    clearTimeout(shutdownTimeout);
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    clearTimeout(shutdownTimeout);
    logger.error({ error }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

startServer();
