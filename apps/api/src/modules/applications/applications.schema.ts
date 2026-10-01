import { z } from 'zod';

export const createApplicationSchema = z.object({
  office: z.enum(['REGISTRAR_OFFICE', 'SEMESTER_CELL']),
  applicationType: z.enum(['PROFORMA', 'TRANSCRIPT']),
  numberOfSemesters: z.coerce.number().int().min(1).max(20),
  purpose: z.string().trim().min(5).max(500),
  notes: z.string().trim().max(500).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    'APPLICATION_SUBMITTED',
    'WAITING_FOR_PAYMENT',
    'PAYMENT_RECEIVED',
    'UNDER_PROCESS',
    'READY_FOR_COLLECTION',
    'COMPLETED',
    'REJECTED',
  ]),
  remark: z.string().trim().max(1000).optional(),
});

export const addRemarkSchema = z.object({
  remark: z.string().trim().min(1).max(1000),
});

export const applicationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum([
    'APPLICATION_SUBMITTED', 'WAITING_FOR_PAYMENT', 'PAYMENT_RECEIVED',
    'UNDER_PROCESS', 'READY_FOR_COLLECTION', 'COMPLETED', 'REJECTED',
  ]).optional(),
  applicationType: z.enum(['PROFORMA', 'TRANSCRIPT']).optional(),
  office: z.enum(['REGISTRAR_OFFICE', 'SEMESTER_CELL']).optional(),
  studentId: z.string().uuid().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});
