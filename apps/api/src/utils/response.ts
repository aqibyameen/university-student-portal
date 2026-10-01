import type { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  page: number,
  pageSize: number,
  total: number,
) {
  return res.json({
    success: true,
    data: items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
