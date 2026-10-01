import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createApplicationSchema, updateStatusSchema, addRemarkSchema, applicationQuerySchema } from './applications.schema';
import { env } from '../../config/env';
import * as ctrl from './applications.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

/**
 * @openapi
 * /applications:
 *   post:
 *     tags: [Applications]
 *     summary: Create application (Student)
 *     description: Submit a new Proforma or Transcript application. Fee is calculated automatically.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateApplicationRequest'
 *           example:
 *             office: REGISTRAR_OFFICE
 *             applicationType: TRANSCRIPT
 *             numberOfSemesters: 6
 *             purpose: Required for job application at ABC Company.
 *     responses:
 *       201:
 *         description: Application created, status set to WAITING_FOR_PAYMENT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 *             example:
 *               success: true
 *               data:
 *                 applicationNumber: APP-2026-000001
 *                 status: WAITING_FOR_PAYMENT
 *                 totalFee: "2200.00"
 */
router.post('/', authenticate, requireRole('STUDENT'), validate(createApplicationSchema), ctrl.create);

/**
 * @openapi
 * /applications:
 *   get:
 *     tags: [Applications]
 *     summary: List applications
 *     description: Students see own applications. Staff see their office applications. Admin sees all.
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
 *         schema: { type: string, enum: [APPLICATION_SUBMITTED, WAITING_FOR_PAYMENT, PAYMENT_RECEIVED, UNDER_PROCESS, READY_FOR_COLLECTION, COMPLETED, REJECTED] }
 *       - in: query
 *         name: applicationType
 *         schema: { type: string, enum: [PROFORMA, TRANSCRIPT] }
 *       - in: query
 *         name: office
 *         schema: { type: string, enum: [REGISTRAR_OFFICE, SEMESTER_CELL] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated applications
 */
router.get('/', authenticate, validate(applicationQuerySchema, 'query'), ctrl.list);

/**
 * @openapi
 * /applications/{id}:
 *   get:
 *     tags: [Applications]
 *     summary: Get application details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Application details with timeline
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:id', authenticate, ctrl.get);

/**
 * @openapi
 * /applications/{id}/status:
 *   patch:
 *     tags: [Applications]
 *     summary: Update application status (Staff/Admin)
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
 *                 enum: [UNDER_PROCESS, READY_FOR_COLLECTION, COMPLETED, REJECTED]
 *                 example: UNDER_PROCESS
 *               remark:
 *                 type: string
 *                 example: Documents verified and processing has started.
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authenticate, requireRole('STAFF', 'ADMIN'), validate(updateStatusSchema), ctrl.updateStatus);

/**
 * @openapi
 * /applications/{id}/remarks:
 *   post:
 *     tags: [Applications]
 *     summary: Add remark to application
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
 *     responses:
 *       201:
 *         description: Remark added
 */
router.post('/:id/remarks', authenticate, validate(addRemarkSchema), ctrl.addRemark);

/**
 * @openapi
 * /applications/{id}/receipt:
 *   post:
 *     tags: [Applications, Payments]
 *     summary: Upload payment receipt (Student)
 *     description: Upload proof of payment. Automatically transitions application to PAYMENT_RECEIVED.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [receipt]
 *             properties:
 *               receipt:
 *                 type: string
 *                 format: binary
 *                 description: Image (JPEG/PNG/WebP) or PDF of paid receipt
 *     responses:
 *       201:
 *         description: Receipt uploaded, status changed to PAYMENT_RECEIVED
 */
router.post('/:id/receipt', authenticate, requireRole('STUDENT'), upload.single('receipt'), ctrl.uploadReceipt);

/**
 * @openapi
 * /applications/{id}/voucher:
 *   get:
 *     tags: [Applications, Payments]
 *     summary: Download fee voucher as PDF
 *     description: Generates and returns a professionally formatted PDF fee voucher.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: PDF voucher
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/voucher', authenticate, ctrl.downloadVoucher);

/**
 * @openapi
 * /applications/{id}/receipt:
 *   get:
 *     tags: [Applications, Payments]
 *     summary: View/download uploaded payment receipt
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Receipt file
 */
router.get('/:id/receipt', authenticate, ctrl.downloadReceipt);

/**
 * @openapi
 * /applications/{id}/history:
 *   get:
 *     tags: [Applications]
 *     summary: Get application status history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Status history
 */
router.get('/:id/history', authenticate, ctrl.getHistory);

export default router;
