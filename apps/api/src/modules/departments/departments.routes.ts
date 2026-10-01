import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createDepartmentSchema, updateDepartmentSchema, departmentQuerySchema } from './departments.schema';
import * as ctrl from './departments.controller';

const router = Router();

/**
 * @openapi
 * /departments:
 *   get:
 *     tags: [Departments]
 *     summary: List departments
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
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of departments
 */
router.get('/', authenticate, validate(departmentQuerySchema, 'query'), ctrl.list);

/**
 * @openapi
 * /departments/{id}:
 *   get:
 *     tags: [Departments]
 *     summary: Get department with issues
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Department details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authenticate, ctrl.get);

/**
 * @openapi
 * /departments:
 *   post:
 *     tags: [Departments]
 *     summary: Create department (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDepartmentRequest'
 *           example:
 *             name: New Department
 *             code: NEWDEPT
 *             description: Handles new area
 *     responses:
 *       201:
 *         description: Department created
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(createDepartmentSchema), ctrl.create);

/**
 * @openapi
 * /departments/{id}:
 *   patch:
 *     tags: [Departments]
 *     summary: Update department (Admin)
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
 *             $ref: '#/components/schemas/UpdateDepartmentRequest'
 *     responses:
 *       200:
 *         description: Department updated
 */
router.patch('/:id', authenticate, requireRole('ADMIN'), validate(updateDepartmentSchema), ctrl.update);

export default router;
