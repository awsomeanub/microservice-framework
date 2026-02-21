import { z } from 'zod';

export const createItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .nullable(),
  price: z
    .number()
    .min(0, 'Price must be non-negative')
    .max(999999.99, 'Price must be at most 999999.99'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(0, 'Quantity must be non-negative')
    .max(999999, 'Quantity must be at most 999999'),
});

export const updateItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(255, 'Name must be at most 255 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .nullable(),
  price: z
    .number()
    .min(0, 'Price must be non-negative')
    .max(999999.99, 'Price must be at most 999999.99')
    .optional(),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(0, 'Quantity must be non-negative')
    .max(999999, 'Quantity must be at most 999999')
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100, 'Limit must be between 1 and 100')),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
