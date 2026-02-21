import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from './index';
import { logger } from '../utils/logger';

// Simple database class for PostgreSQL connections
class Database {
  private pool: Pool | null = null;

  // Initialize database connection pool
  async initialize(): Promise<void> {
    if (this.pool) {
      return;
    }

    // Create a connection pool with basic configuration
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
    });

    // Test the connection by running a simple query
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  // Execute a SQL query with optional parameters
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    return this.pool.query<T>(text, params);
  }

  // Check if the database connection is healthy
  async healthCheck(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }

    try {
      const result = await this.pool.query('SELECT 1');
      return result.rowCount === 1;
    } catch {
      return false;
    }
  }
}

export const database = new Database();
