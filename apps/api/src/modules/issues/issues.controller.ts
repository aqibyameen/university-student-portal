import type { Request, Response, NextFunction } from 'express';
import * as service from './issues.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

export async function listByDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const issues = await service.listIssuesByDepartment(req.params.departmentId);
    sendSuccess(res, issues);
  } catch (err) { next(err); }
}

export async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 50;
    const search = req.query.search as string | undefined;
    const { items, total } = await service.listAllIssues(page, pageSize, search);
    sendPaginated(res, items, page, pageSize, total);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.createIssue(req.body), 201);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.updateIssue(req.params.id, req.body));
  } catch (err) { next(err); }
}
