import { z } from 'zod';
import { LOOKUP_CATEGORIES, LOOKUP_STATUSES } from '../constants/lookup-categories.js';

export const proposeLookupSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(160),
});

export const createAdminLookupSchema = z.object({
  category: z.enum(LOOKUP_CATEGORIES),
  name: z.string().trim().min(1).max(160),
  value: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(240).optional().default(''),
  order: z.number().int().min(0).max(9999).optional().default(0),
  status: z.enum(LOOKUP_STATUSES).optional().default('approved'),
  isActive: z.boolean().optional().default(true),
});

export const updateAdminLookupSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    value: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(240).optional(),
    order: z.number().int().min(0).max(9999).optional(),
    status: z.enum(LOOKUP_STATUSES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'Provide at least one field to update',
  });

export const rejectLookupSchema = z.object({
  reason: z.string().trim().max(400).optional().default(''),
});
