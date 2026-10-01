import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './docs/swagger';

// Routes
import authRoutes from './modules/auth/auth.routes';
import departmentRoutes from './modules/departments/departments.routes';
import issueRoutes from './modules/issues/issues.routes';
import ticketRoutes from './modules/tickets/tickets.routes';
import applicationRoutes from './modules/applications/applications.routes';
import studentRoutes from './modules/students/students.routes';
import staffRoutes from './modules/staff/staff.routes';
import adminRoutes from './modules/admin/admin.routes';

// Ensure upload directory exists
const uploadsDir = path.resolve(env.UPLOAD_DIR);
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ──────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// ── Swagger UI ─────────────────────────────────────────────────────────────
setupSwagger(app);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api', issueRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

// ── Error handler ──────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(env.API_PORT, () => {
  console.log(`✅  API server running on http://localhost:${env.API_PORT}`);
  console.log(`📖  Swagger UI: http://localhost:${env.API_PORT}/api/docs`);
  console.log(`📄  OpenAPI spec: http://localhost:${env.API_PORT}/api/docs.json`);
});

export default app;
