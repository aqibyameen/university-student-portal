import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().toUpperCase().min(2).max(20),
  description: z.string().trim().max(500).optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const departmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional().transform(v => v === undefined ? undefined : v === 'true'),
});
