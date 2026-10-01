import type { Request, Response, NextFunction } from 'express';
import * as service from './departments.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { items, page, pageSize, total } = await service.listDepartments(req.query as any);
    sendPaginated(res, items, page, pageSize, total);
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getDepartment(req.params.id));
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.createDepartment(req.body), 201);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.updateDepartment(req.params.id, req.body));
  } catch (err) { next(err); }
}
