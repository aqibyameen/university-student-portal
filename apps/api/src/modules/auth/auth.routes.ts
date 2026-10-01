import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { studentLoginSchema, staffLoginSchema, refreshSchema } from './auth.schema';
import * as ctrl from './auth.controller';

const router = Router();

/**
 * @openapi
 * /auth/student/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Student login
 *     description: Authenticate a student using their seat number and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentLoginRequest'
 *           example:
 *             seatNumber: CS-2026-001
 *             password: Student123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/student/login', validate(studentLoginSchema), ctrl.studentLogin);

/**
 * @openapi
 * /auth/staff/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Staff / Admin login
 *     description: Authenticate a staff member or admin using email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffLoginRequest'
 *           example:
 *             email: it.staff@portal.edu
 *             password: Staff123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/staff/login', validate(staffLoginSchema), ctrl.staffLogin);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access/refresh token pair.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New token pair issued
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', validate(refreshSchema), ctrl.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout
 *     description: Revoke the provided refresh token and end the session.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', authenticate, ctrl.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user
 *     description: Returns the authenticated user's profile.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authenticate, ctrl.getMe);

export default router;
