import { z } from 'zod';

export const createTicketSchema = z.object({
  departmentId: z.string().uuid(),
  issueId: z.string().uuid(),
  description: z.string().trim().min(10).max(2000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED', 'CLOSED', 'REJECTED']),
  remark: z.string().trim().max(1000).optional(),
});

export const addRemarkSchema = z.object({
  remark: z.string().trim().min(1).max(1000),
});

export const ticketQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED', 'CLOSED', 'REJECTED']).optional(),
  departmentId: z.string().uuid().optional(),
  issueId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});
