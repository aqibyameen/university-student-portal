import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createIssueSchema, updateIssueSchema } from './issues.schema';
import * as ctrl from './issues.controller';

const router = Router();

/**
 * @openapi
 * /departments/{departmentId}/issues:
 *   get:
 *     tags: [Issues]
 *     summary: List active issues for a department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Issues list
 */
router.get('/departments/:departmentId/issues', authenticate, ctrl.listByDepartment);

/**
 * @openapi
 * /issues:
 *   get:
 *     tags: [Issues]
 *     summary: List all issues (Admin/Staff)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Issues list
 */
router.get('/issues', authenticate, requireRole('ADMIN', 'STAFF'), ctrl.listAll);

/**
 * @openapi
 * /issues:
 *   post:
 *     tags: [Issues]
 *     summary: Create issue (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateIssueRequest'
 *           example:
 *             departmentId: uuid-here
 *             name: WiFi not working
 *             description: Campus WiFi is unavailable
 *     responses:
 *       201:
 *         description: Issue created
 */
router.post('/issues', authenticate, requireRole('ADMIN'), validate(createIssueSchema), ctrl.create);

/**
 * @openapi
 * /issues/{id}:
 *   patch:
 *     tags: [Issues]
 *     summary: Update issue (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateIssueRequest'
 *     responses:
 *       200:
 *         description: Issue updated
 */
router.patch('/issues/:id', authenticate, requireRole('ADMIN'), validate(updateIssueSchema), ctrl.update);

export default router;
