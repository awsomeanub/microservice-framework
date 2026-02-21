import { v4 as uuidv4 } from 'uuid';
import { database } from '../config/database';
import { Item, CreateItemDto, UpdateItemDto, PaginatedResponse } from '../types/item';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

// Service class handling business logic for item operations
export class ItemService {
  private readonly tableName = 'items';

  // Create a new item in the database
  async create(data: CreateItemDto): Promise<Item> {
    // Generate unique ID and timestamps
    const id = uuidv4();
    const now = new Date();

    try {
      const result = await database.query<Item>(
        `INSERT INTO ${this.tableName} (id, name, description, price, quantity, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, data.name, data.description || null, data.price, data.quantity, now, now]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create item:', error);
      throw error;
    }
  }

  // Find a single item by its ID
  async findById(id: string): Promise<Item> {
    try {
      const result = await database.query<Item>(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      // Throw 404 error if item not found
      if (result.rowCount === 0) {
        throw new NotFoundError('Item', id);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to find item:', error);
      throw error;
    }
  }

  // Get paginated list of all items
  async findAll(page: number, limit: number): Promise<PaginatedResponse<Item>> {
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    try {
      // Fetch items and total count in parallel
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
      logger.error('Failed to find items:', error);
      throw error;
    }
  }

  // Update an existing item by ID
  async update(id: string, data: UpdateItemDto): Promise<Item> {
    try {
      // Verify item exists before updating
      await this.findById(id);

      // Build dynamic update query based on provided fields
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

      // Always update the updated_at timestamp
      fields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      values.push(id);

      const result = await database.query<Item>(
        `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to update item:', error);
      throw error;
    }
  }

  // Delete an item by ID
  async delete(id: string): Promise<void> {
    try {
      // Verify item exists before deleting
      await this.findById(id);

      await database.query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to delete item:', error);
      throw error;
    }
  }
}

export const itemService = new ItemService();
