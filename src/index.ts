import { createApp } from './app';
import { config } from './config';
import { database } from './config/database';
import { logger } from './utils/logger';

// Main entry point for the CRUD microservice
async function startServer(): Promise<void> {
  try {
    logger.info('Starting microservice...');

    // Initialize database connection before starting the server
    await database.initialize();

    // Create Express application with all middleware and routes configured
    const app = createApp();

    // Start the HTTP server on configured port
    app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
