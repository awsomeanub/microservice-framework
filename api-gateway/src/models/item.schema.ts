import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  price: z.number().positive('Price must be positive').max(999999.99, 'Price must be less than 1,000,000'),
  quantity: z.number().int('Quantity must be an integer').nonnegative('Quantity must be non-negative'),
});

export const updateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less').optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  price: z.number().positive('Price must be positive').max(999999.99, 'Price must be less than 1,000,000').optional(),
  quantity: z.number().int('Quantity must be an integer').nonnegative('Quantity must be non-negative').optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .refine((val) => val > 0, 'Page must be positive'),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
