import { v4 as uuidv4 } from 'uuid';
import { database } from '../config/database';
import { Item, CreateItemDto, UpdateItemDto, PaginatedResponse } from '../types/item';
import { NotFoundError, DatabaseError } from '../utils/errors';
import { dbQueryDuration } from '../utils/metrics';
import { logger } from '../utils/logger';

export class ItemService {
  private readonly tableName = 'items';

  async create(data: CreateItemDto): Promise<Item> {
    const id = uuidv4();
    const now = new Date();
    const timer = dbQueryDuration.startTimer({ operation: 'insert', table: this.tableName });

    try {
      const result = await database.query<Item>(
        `INSERT INTO ${this.tableName} (id, name, description, price, quantity, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, data.name, data.description || null, data.price, data.quantity, now, now]
      );

      timer();
      return result.rows[0];
    } catch (error) {
      timer();
      logger.error({ error, data }, 'Failed to create item');
      throw new DatabaseError('Failed to create item', error);
    }
  }

  async findById(id: string): Promise<Item> {
    const timer = dbQueryDuration.startTimer({ operation: 'select', table: this.tableName });

    try {
      const result = await database.query<Item>(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      timer();

      if (result.rowCount === 0) {
        throw new NotFoundError('Item', id);
      }

      return result.rows[0];
    } catch (error) {
      timer();
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ error, id }, 'Failed to find item by id');
      throw new DatabaseError('Failed to find item', error);
    }
  }

  async findAll(page: number, limit: number): Promise<PaginatedResponse<Item>> {
    const offset = (page - 1) * limit;
    const timer = dbQueryDuration.startTimer({ operation: 'select', table: this.tableName });

    try {
      const [dataResult, countResult] = await Promise.all([
        database.query<Item>(
          `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
          [limit, offset]
        ),
        database.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${this.tableName}`,
          []
        ),
      ]);

      timer();

      const total = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(total / limit);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      timer();
      logger.error({ error, page, limit }, 'Failed to find all items');
      throw new DatabaseError('Failed to retrieve items', error);
    }
  }

  async update(id: string, data: UpdateItemDto): Promise<Item> {
    const timer = dbQueryDuration.startTimer({ operation: 'update', table: this.tableName });

    try {
      await this.findById(id);

      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.price !== undefined) {
        fields.push(`price = $${paramIndex++}`);
        values.push(data.price);
      }
      if (data.quantity !== undefined) {
        fields.push(`quantity = $${paramIndex++}`);
        values.push(data.quantity);
      }

      fields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      values.push(id);

      const result = await database.query<Item>(
        `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      timer();
      return result.rows[0];
    } catch (error) {
      timer();
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ error, id, data }, 'Failed to update item');
      throw new DatabaseError('Failed to update item', error);
    }
  }

  async delete(id: string): Promise<void> {
    const timer = dbQueryDuration.startTimer({ operation: 'delete', table: this.tableName });

    try {
      await this.findById(id);

      await database.query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      timer();
    } catch (error) {
      timer();
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ error, id }, 'Failed to delete item');
      throw new DatabaseError('Failed to delete item', error);
    }
  }
}

export const itemService = new ItemService();
