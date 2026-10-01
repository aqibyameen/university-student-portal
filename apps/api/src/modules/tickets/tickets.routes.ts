import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createTicketSchema, updateStatusSchema, addRemarkSchema, ticketQuerySchema } from './tickets.schema';
import { env } from '../../config/env';
import * as ctrl from './tickets.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

/**
 * @openapi
 * /tickets:
 *   post:
 *     tags: [Tickets]
 *     summary: Create a ticket (Student)
 *     description: Submit a new complaint/issue ticket. Optionally attach an image.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [departmentId, issueId, description]
 *             properties:
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *               issueId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *                 example: The WiFi in the computer lab has been down for 3 days.
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Ticket created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *             example:
 *               success: true
 *               data:
 *                 ticketNumber: TKT-2026-000001
 *                 status: OPEN
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/',
  authenticate,
  requireRole('STUDENT'),
  upload.single('attachment'),
  validate(createTicketSchema),
  ctrl.create,
);

/**
 * @openapi
 * /tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: List tickets
 *     description: >
 *       Students see only their own tickets.
 *       Staff see only tickets for their department.
 *       Admin sees all tickets.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [OPEN, IN_PROGRESS, WAITING_FOR_STUDENT, RESOLVED, CLOSED, REJECTED] }
 *       - in: query
 *         name: departmentId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Paginated tickets
 */
router.get('/', authenticate, validate(ticketQuerySchema, 'query'), ctrl.list);

/**
 * @openapi
 * /tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: Get ticket details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Ticket with full details
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authenticate, ctrl.get);

/**
 * @openapi
 * /tickets/{id}/status:
 *   patch:
 *     tags: [Tickets]
 *     summary: Update ticket status (Staff/Admin)
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
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [IN_PROGRESS, WAITING_FOR_STUDENT, RESOLVED, CLOSED, REJECTED]
 *                 example: IN_PROGRESS
 *               remark:
 *                 type: string
 *                 example: Issue received and being investigated.
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authenticate, requireRole('STAFF', 'ADMIN'), validate(updateStatusSchema), ctrl.updateStatus);

/**
 * @openapi
 * /tickets/{id}/remarks:
 *   post:
 *     tags: [Tickets]
 *     summary: Add a remark to a ticket
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
 *             type: object
 *             required: [remark]
 *             properties:
 *               remark:
 *                 type: string
 *                 example: We have escalated this to the network team.
 *     responses:
 *       201:
 *         description: Remark added
 */
router.post('/:id/remarks', authenticate, validate(addRemarkSchema), ctrl.addRemark);

/**
 * @openapi
 * /tickets/{id}/history:
 *   get:
 *     tags: [Tickets]
 *     summary: Get ticket status history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Status history timeline
 */
router.get('/:id/history', authenticate, ctrl.getHistory);

/**
 * @openapi
 * /tickets/attachments/{attachmentId}:
 *   get:
 *     tags: [Tickets]
 *     summary: Download a ticket attachment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: File binary
 *         content:
 *           image/jpeg:
 *             schema: { type: string, format: binary }
 */
router.get('/attachments/:attachmentId', authenticate, ctrl.getAttachment);

export default router;
