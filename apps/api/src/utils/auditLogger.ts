import { prisma } from '../lib/prisma';
import type { Request } from 'express';

interface AuditEntry {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}

export async function auditLog(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata as object | undefined,
        ipAddress: entry.req ? (entry.req.ip ?? null) : null,
        userAgent: entry.req ? (entry.req.get('user-agent') ?? null) : null,
      },
    });
  } catch {
    // Audit logging must never crash the application
  }
}
