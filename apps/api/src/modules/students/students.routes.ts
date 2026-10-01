import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { sendSuccess } from '../../utils/response';
import * as service from './students.service';
import type { AuthRequest } from '../../middleware/authenticate';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

const updateProfileSchema = z.object({
  phone: z.string().trim().max(20).optional(),
  email: z.string().email().max(254).optional(),
});

/**
 * @openapi
 * /students/me:
 *   get:
 *     tags: [Students]
 *     summary: Get own student profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student profile
 */
router.get('/me', authenticate, requireRole('STUDENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    sendSuccess(res, await service.getMyProfile(user.studentId!));
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /students/me:
 *   patch:
 *     tags: [Students]
 *     summary: Update own student profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch('/me', authenticate, requireRole('STUDENT'), validate(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    sendSuccess(res, await service.updateMyProfile(user.studentId!, req.body));
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /students/dashboard:
 *   get:
 *     tags: [Students]
 *     summary: Get student dashboard data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics and recent activity
 */
router.get('/dashboard', authenticate, requireRole('STUDENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    sendSuccess(res, await service.getStudentDashboard(user.studentId!));
  } catch (err) { next(err); }
});

export default router;
