import type { Request, Response, NextFunction } from 'express';
import * as service from './auth.service';
import { sendSuccess } from '../../utils/response';
import { auditLog } from '../../utils/auditLogger';
import type { AuthRequest } from '../../middleware/authenticate';

export async function studentLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { seatNumber, password } = req.body;
    const result = await service.studentLogin(seatNumber, password);
    await auditLog({ userId: result.user.id, action: 'LOGIN', entityType: 'User', entityId: result.user.id, req });
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function staffLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await service.staffLogin(email, password);
    await auditLog({ userId: result.user.id, action: 'LOGIN', entityType: 'User', entityId: result.user.id, req });
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const result = await service.refresh(refreshToken);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await service.logout(refreshToken);
    const user = (req as AuthRequest).user;
    if (user) await auditLog({ userId: user.sub, action: 'LOGOUT', entityType: 'User', entityId: user.sub, req });
    sendSuccess(res, { message: 'Logged out successfully.' });
  } catch (err) { next(err); }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as AuthRequest).user;
    const result = await service.getMe(user.sub);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
