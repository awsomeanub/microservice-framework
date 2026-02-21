import { config } from '../config';

// Simple logger using console for basic logging needs
export const logger = {
  // Log informational messages
  info: (message: string, ...args: unknown[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },

  // Log error messages
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },

  // Log warning messages
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },

  // Log debug messages (only in non-production)
  debug: (message: string, ...args: unknown[]) => {
    if (!config.isProduction) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
};
