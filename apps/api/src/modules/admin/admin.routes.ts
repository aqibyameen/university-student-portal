import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { auditLog } from '../../utils/auditLogger';
import { createStaffSchema, updateStaffSchema, updateFeeConfigSchema, adminQuerySchema, reportQuerySchema } from './admin.schema';
import * as service from './admin.service';
import type { AuthRequest } from '../../middleware/authenticate';
import type { Request, Response, NextFunction } from 'express';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')];

const h = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => fn;

/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard with system-wide statistics and charts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data from PostgreSQL aggregations
 */
router.get('/dashboard', ...adminOnly, h(async (req, res, next) => {
  try { sendSuccess(res, await service.getAdminDashboard()); } catch (err) { next(err); }
}));

/**
 * @openapi
 * /admin/students:
 *   get:
 *     tags: [Admin]
 *     summary: List all students
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated students
 */
router.get('/students', ...adminOnly, validate(adminQuerySchema, 'query'), h(async (req, res, next) => {
  try {
    const { items, page, pageSize, total } = await service.listStudents(req.query as any);
    sendPaginated(res, items, page, pageSize, total);
  } catch (err) { next(err); }
}));

/**
 * @openapi
 * /admin/staff:
 *   get:
 *     tags: [Admin]
 *     summary: List all staff
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated staff
 */
router.get('/staff', ...adminOnly, validate(adminQuerySchema, 'query'), h(async (req, res, next) => {
  try {
    const { items, page, pageSize, total } = await service.listStaff(req.query as any);
    sendPaginated(res, items, page, pageSize, total);
  } catch (err) { next(err); }
}));

/**
 * @openapi
 * /admin/staff:
 *   post:
 *     tags: [Admin]
 *     summary: Create staff account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStaffRequest'
 *           example:
 *             email: new.staff@portal.edu
 *             password: Staff123!
 *             fullName: Dr. New Staff
 *             departmentId: uuid-here
 *             employeeId: EMP-NEW-001
 *     responses:
 *       201:
 *         description: Staff account created
 */
router.post('/staff', ...adminOnly, validate(createStaffSchema), h(async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user;
    const staff = await service.createStaff(req.body);
    await auditLog({ userId: user.sub, action: 'STAFF_CREATED', entityType: 'Staff', entityId: staff.id, metadata: { email: req.body.email }, req });
    sendSuccess(res, staff, 201);
  } catch (err) { next(err); }
}));

/**
 * @openapi
 * /admin/staff/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update staff account
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
 *             $ref: '#/components/schemas/UpdateStaffRequest'
 *     responses:
 *       200:
 *         description: Staff updated
 */
router.patch('/staff/:id', ...adminOnly, validate(updateStaffSchema), h(async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user;
    const staff = await service.updateStaff(req.params.id, req.body);
    await auditLog({ userId: user.sub, action: 'STAFF_UPDATED', entityType: 'Staff', entityId: req.params.id, req });
    sendSuccess(res, staff);
  } catch (err) { next(err); }
}));

/**
 * @openapi
 * /admin/fee-configurations:
 *   get:
 *     tags: [Admin]
 *     summary: Get all fee configurations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fee configurations
 */
router.get('/fee-configurations', ...adminOnly, h(async (_req, res, next) => {
  try { sendSuccess(res, await service.getFeeConfigurations()); } catch (err) { next(err); }
}));

/**
 * @openapi
 * /admin/fee-configurations/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update fee configuration
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
 *             properties:
 *               baseFee:
 *                 type: number
 *                 example: 1000
 *               perSemesterFee:
 *                 type: number
 *                 example: 200
 *     responses:
 *       200:
 *         description: Fee configuration updated
 */
router.patch('/fee-configurations/:id', ...adminOnly, validate(updateFeeConfigSchema), h(async (req, res, next) => {
  try {
    const user = (req as AuthRequest).user;
    const config = await service.updateFeeConfiguration(req.params.id, req.body);
    await auditLog({ userId: user.sub, action: 'FEE_UPDATED', entityType: 'FeeConfiguration', entityId: req.params.id, req });
    sendSuccess(res, config);
  } catch (err) { next(err); }
}));

/**
 * @openapi
 * /admin/reports/tickets:
 *   get:
 *     tags: [Admin, Reports]
 *     summary: Ticket report with CSV export
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: departmentId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv] }
 *     responses:
 *       200:
 *         description: Ticket report
 */
router.get('/reports/tickets', ...adminOnly, validate(reportQuerySchema, 'query'), h(async (req, res, next) => {
  try {
    const report = await service.getTicketReport(req.query as any);
    if (req.query.format === 'csv') {
      const csv = buildTicketCsv(report.tickets as any[]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ticket-report.csv"');
      return res.send(csv);
    }
    sendSuccess(res, report);
  } catch (err) { next(err); }
}));

/**
 * @openapi
 * /admin/reports/applications:
 *   get:
 *     tags: [Admin, Reports]
 *     summary: Application report with CSV export
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: applicationType
 *         schema: { type: string, enum: [PROFORMA, TRANSCRIPT] }
 *       - in: query
 *         name: office
 *         schema: { type: string, enum: [REGISTRAR_OFFICE, SEMESTER_CELL] }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv] }
 *     responses:
 *       200:
 *         description: Application report
 */
router.get('/reports/applications', ...adminOnly, validate(reportQuerySchema, 'query'), h(async (req, res, next) => {
  try {
    const report = await service.getApplicationReport(req.query as any);
    if (req.query.format === 'csv') {
      const csv = buildApplicationCsv(report.applications as any[]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="application-report.csv"');
      return res.send(csv);
    }
    sendSuccess(res, report);
  } catch (err) { next(err); }
}));

/**
 * @openapi
 * /admin/audit-logs:
 *   get:
 *     tags: [Admin, Audit Logs]
 *     summary: View audit logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Audit logs
 */
router.get('/audit-logs', ...adminOnly, h(async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const { items, total } = await service.getAuditLogs(page, pageSize, req.query.userId as string, req.query.action as string);
    sendPaginated(res, items, page, pageSize, total);
  } catch (err) { next(err); }
}));

// CSV helpers
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildTicketCsv(tickets: any[]): string {
  const headers = ['Ticket #', 'Student', 'Seat Number', 'Program', 'Department', 'Issue', 'Status', 'Priority', 'Created'];
  const rows = tickets.map(t => [
    t.ticketNumber, t.student?.fullName, t.student?.seatNumber, t.student?.program,
    t.department?.name, t.issue?.name, t.status, t.priority,
    new Date(t.createdAt).toLocaleDateString('en-PK'),
  ].map(escapeCsv).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function buildApplicationCsv(apps: any[]): string {
  const headers = ['Application #', 'Student', 'Seat Number', 'Program', 'Type', 'Office', 'Semesters', 'Total Fee', 'Status', 'Created'];
  const rows = apps.map(a => [
    a.applicationNumber, a.student?.fullName, a.student?.seatNumber, a.student?.program,
    a.applicationType, a.office, a.numberOfSemesters, a.totalFee, a.status,
    new Date(a.createdAt).toLocaleDateString('en-PK'),
  ].map(escapeCsv).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export default router;
