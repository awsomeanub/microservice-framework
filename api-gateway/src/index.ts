import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

// Main entry point for the API Gateway
async function startServer(): Promise<void> {
  try {
    logger.info('Starting API Gateway...');

    // Create Express application with all middleware and routes configured
    const app = createApp();

    // Start the HTTP server on configured port
    app.listen(config.port, () => {
      logger.info(`API Gateway started on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
}

startServer();
