import { z } from 'zod';

export const createIssueSchema = z.object({
  departmentId: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(500).optional(),
});

export const updateIssueSchema = createIssueSchema.partial().extend({
  isActive: z.boolean().optional(),
});
