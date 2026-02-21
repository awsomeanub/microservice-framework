import express, { Application } from 'express';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { routes } from './routes';

// Creates and configures the Express application
export function createApp(): Application {
  const app = express();

  // Parse incoming JSON request bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Log all incoming requests for debugging
  app.use(requestLogger);

  // Set basic security headers on all responses
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Mount all API routes
  app.use(routes);

  // Handle 404 errors for undefined routes
  app.use(notFoundHandler);

  // Global error handler for catching all errors
  app.use(errorHandler);

  return app;
}
