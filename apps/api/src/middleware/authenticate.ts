import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt';
import { Errors } from '../lib/errors';

export interface AuthRequest extends Request {
  user: AccessTokenPayload;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw Errors.unauthorized();
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    (req as AuthRequest).user = payload;
    next();
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'TokenExpiredError') {
      next(Errors.unauthorized('Token expired. Please refresh your session.'));
    } else if ((err as { statusCode?: number }).statusCode) {
      next(err);
    } else {
      next(Errors.unauthorized('Invalid token.'));
    }
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!user || !roles.includes(user.role)) {
      return next(Errors.forbidden());
    }
    next();
  };
}
