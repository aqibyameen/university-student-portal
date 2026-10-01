import { z } from 'zod';

export const studentLoginSchema = z.object({
  seatNumber: z.string().trim().min(3).max(20),
  password: z.string().min(1).max(128),
});

export const staffLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
