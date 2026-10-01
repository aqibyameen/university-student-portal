import { z } from 'zod';

export const createStaffSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(2).max(100),
  departmentId: z.string().uuid(),
  employeeId: z.string().trim().min(2).max(30),
  phone: z.string().trim().max(20).optional(),
});

export const updateStaffSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  departmentId: z.string().uuid().optional(),
  phone: z.string().trim().max(20).optional(),
  isActive: z.boolean().optional(),
});

export const updateFeeConfigSchema = z.object({
  baseFee: z.coerce.number().positive().max(100000),
  perSemesterFee: z.coerce.number().positive().max(100000),
  isActive: z.boolean().optional(),
});

export const adminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional().transform(v => v === undefined ? undefined : v === 'true'),
});

export const reportQuerySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.string().optional(),
  applicationType: z.enum(['PROFORMA', 'TRANSCRIPT']).optional(),
  office: z.enum(['REGISTRAR_OFFICE', 'SEMESTER_CELL']).optional(),
});
