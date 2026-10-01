import type { Request, Response, NextFunction } from 'express';
import * as service from './tickets.service';
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
    const ticket = await service.createTicket(
      user.studentId!,
      user.sub,
      req.body,
      req.file,
    );
    await auditLog({ userId: user.sub, action: 'TICKET_CREATED', entityType: 'Ticket', entityId: ticket?.id, metadata: { ticketNumber: ticket?.ticketNumber }, req });
    sendSuccess(res, ticket, 201);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { items, page, pageSize, total } = await service.listTickets(req.query as any, getScope(req));
    sendPaginated(res, items, page, pageSize, total);
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getTicket(req.params.id, getScope(req)));
  } catch (err) { next(err); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as AuthRequest).user;
    const ticket = await service.updateTicketStatus(req.params.id, user.sub, req.body, getScope(req));
    await auditLog({ userId: user.sub, action: 'TICKET_STATUS_CHANGED', entityType: 'Ticket', entityId: req.params.id, metadata: { newStatus: req.body.status }, req });
    sendSuccess(res, ticket);
  } catch (err) { next(err); }
}

export async function addRemark(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as AuthRequest).user;
    const remark = await service.addRemark(req.params.id, user.sub, req.body, getScope(req));
    await auditLog({ userId: user.sub, action: 'TICKET_REMARK_ADDED', entityType: 'Ticket', entityId: req.params.id, req });
    sendSuccess(res, remark, 201);
  } catch (err) { next(err); }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getTicketHistory(req.params.id, getScope(req)));
  } catch (err) { next(err); }
}

export async function getAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    const { buffer, mimeType, filename } = await service.serveAttachment(req.params.attachmentId, getScope(req));
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  } catch (err) { next(err); }
}
