import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { sendSuccess } from '../../utils/response';
import * as service from './staff.service';
import type { AuthRequest } from '../../middleware/authenticate';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * @openapi
 * /staff/dashboard:
 *   get:
 *     tags: [Staff]
 *     summary: Get staff dashboard data
 *     description: Returns department-specific statistics and recent activity for the authenticated staff member.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff dashboard data
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/dashboard', authenticate, requireRole('STAFF'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    sendSuccess(res, await service.getStaffDashboard(user.staffDeptId!));
  } catch (err) { next(err); }
});

export default router;
