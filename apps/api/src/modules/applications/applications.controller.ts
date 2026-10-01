import type { Request, Response, NextFunction } from 'express';
import * as service from './applications.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { auditLog } from '../../utils/auditLogger';
import type { AuthRequest } from '../../middleware/authenticate';

function getScope(req: Request) {
  const user = (req as AuthRequest).user;
  return { role: user.role, studentId: user.studentId, departmentId: user.staffDeptId };
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as AuthRequest).user;
    const app = await service.createApplication(user.studentId!, user.sub, req.body);
    await auditLog({ userId: user.sub, action: 'APPLICATION_CREATED', entityType: 'Application', entityId: app.id, metadata: { applicationNumber: app.applicationNumber }, req });
    sendSuccess(res, app, 201);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { items, page, pageSize, total } = await service.listApplications(req.query as any, getScope(req));
    sendPaginated(res, items, page, pageSize, total);
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getApplication(req.params.id, getScope(req)));
  } catch (err) { next(err); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as AuthRequest).user;
    const app = await service.updateApplicationStatus(req.params.id, user.sub, req.body, getScope(req));
    await auditLog({ userId: user.sub, action: 'APPLICATION_STATUS_CHANGED', entityType: 'Application', entityId: req.params.id, metadata: { newStatus: req.body.status }, req });
    sendSuccess(res, app);
  } catch (err) { next(err); }
}

export async function addRemark(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as AuthRequest).user;
    const remark = await service.addRemark(req.params.id, user.sub, req.body, getScope(req));
    sendSuccess(res, remark, 201);
  } catch (err) { next(err); }
}

export async function uploadReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as AuthRequest).user;
    if (!req.file) {
      return next(new Error('No file uploaded.'));
    }
    const receipt = await service.uploadReceipt(req.params.id, user.sub, req.file, getScope(req));
    await auditLog({ userId: user.sub, action: 'RECEIPT_UPLOADED', entityType: 'Application', entityId: req.params.id, req });
    sendSuccess(res, receipt, 201);
  } catch (err) { next(err); }
}

export async function downloadVoucher(req: Request, res: Response, next: NextFunction) {
  try {
    const { buffer, filename } = await service.getVoucher(req.params.id, getScope(req));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) { next(err); }
}

export async function downloadReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const { buffer, mimeType, filename } = await service.serveReceipt(req.params.id, getScope(req));
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  } catch (err) { next(err); }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getApplicationHistory(req.params.id, getScope(req)));
  } catch (err) { next(err); }
}
