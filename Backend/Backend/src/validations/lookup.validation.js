import { z } from 'zod';

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildLookupCreateSchema({ nameMax = 120, valueMax = 80 } = {}) {
  return z
    .object({
      name: z.string().trim().min(1, 'Name is required').max(nameMax),
      value: z.string().trim().min(1).max(valueMax).optional(),
      description: z.string().trim().max(240).default(''),
      order: z.number().int().min(0).max(9999).default(0),
      isActive: z.boolean().default(true),
    })
    .transform((data) => ({
      ...data,
      value: data.value && data.value.length > 0 ? data.value : slugify(data.name),
    }));
}

export function buildLookupUpdateSchema({ nameMax = 120, valueMax = 80 } = {}) {
  return z
    .object({
      name: z.string().trim().min(1).max(nameMax).optional(),
      value: z.string().trim().min(1).max(valueMax).optional(),
      description: z.string().trim().max(240).optional(),
      order: z.number().int().min(0).max(9999).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    });
}
