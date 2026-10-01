import { z } from 'zod';

export const studentLoginSchema = z.object({
  seatNumber: z.string().trim().min(3).max(30),
  password: z.string().min(1).max(128),
});

export const staffLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
