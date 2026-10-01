import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';
import { generateTicketNumber } from '../../utils/ticketNumber';
import { storageService } from '../../storage/StorageService';
import { TICKET_TRANSITIONS } from '@portal/types';
import type { TicketStatus } from '@prisma/client';
import type { z } from 'zod';
import type { createTicketSchema, ticketQuerySchema, updateStatusSchema, addRemarkSchema } from './tickets.schema';

const TICKET_INCLUDE = {
  student: { select: { id: true, seatNumber: true, fullName: true, program: true, department: true, semester: true, email: true, phone: true } },
  department: { select: { id: true, name: true, code: true } },
  issue: { select: { id: true, name: true } },
  attachments: true,
  remarks: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      user: { select: { id: true, role: true, staffProfile: { select: { fullName: true } }, student: { select: { fullName: true } } } },
    },
  },
  statusHistory: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      user: { select: { id: true, role: true, staffProfile: { select: { fullName: true } }, student: { select: { fullName: true } } } },
    },
  },
};

export async function createTicket(
  studentId: string,
  userId: string,
  data: z.infer<typeof createTicketSchema>,
  attachment?: Express.Multer.File,
) {
  // Validate department & issue belong together
  const issue = await prisma.issue.findFirst({
    where: { id: data.issueId, departmentId: data.departmentId, isActive: true },
  });
  if (!issue) throw Errors.badRequest('Issue does not belong to the selected department or is inactive.');

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw Errors.notFound('Student');

  // Generate ticket number using count
  const count = await prisma.ticket.count();
  const ticketNumber = generateTicketNumber(count + 1);

  const ticket = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.create({
      data: {
        ticketNumber,
        studentId,
        departmentId: data.departmentId,
        issueId: data.issueId,
        description: data.description,
        priority: data.priority,
        status: 'OPEN',
      },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: t.id,
        oldStatus: null,
        newStatus: 'OPEN',
        remark: 'Ticket created.',
        changedBy: userId,
      },
    });

    return t;
  });

  // Handle attachment outside transaction (file IO)
  if (attachment) {
    try {
      const stored = await storageService.saveTicketAttachment(attachment, ticket.id);
      await prisma.ticketAttachment.create({
        data: {
          ticketId: ticket.id,
          ...stored,
        },
      });
    } catch (err: unknown) {
      // Attachment failure shouldn't block ticket creation
      console.error('Attachment save failed:', err);
    }
  }

  return prisma.ticket.findUnique({ where: { id: ticket.id }, include: TICKET_INCLUDE });
}

export async function listTickets(
  query: z.infer<typeof ticketQuerySchema>,
  scope: { role: string; studentId?: string; departmentId?: string },
) {
  const { page, pageSize, status, departmentId, issueId, studentId, search, dateFrom, dateTo, sortDirection } = query;

  const where: Record<string, unknown> = {};

  // Role-based scoping
  if (scope.role === 'STUDENT') {
    where['studentId'] = scope.studentId;
  } else if (scope.role === 'STAFF') {
    where['departmentId'] = scope.departmentId;
  }

  // Additional filters (admin can use all; staff/student filters are bounded above)
  if (status) where['status'] = status;
  if (departmentId && scope.role === 'ADMIN') where['departmentId'] = departmentId;
  if (issueId) where['issueId'] = issueId;
  if (studentId && scope.role === 'ADMIN') where['studentId'] = studentId;
  if (dateFrom || dateTo) {
    where['createdAt'] = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    };
  }
  if (search) {
    where['OR'] = [
      { ticketNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: sortDirection },
      include: {
        student: { select: { id: true, seatNumber: true, fullName: true, program: true } },
        department: { select: { id: true, name: true, code: true } },
        issue: { select: { id: true, name: true } },
        _count: { select: { attachments: true, remarks: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return { items, page, pageSize, total };
}

export async function getTicket(ticketId: string, scope: { role: string; studentId?: string; departmentId?: string }) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: TICKET_INCLUDE,
  });
  if (!ticket) throw Errors.notFound('Ticket');

  // Authorization checks
  if (scope.role === 'STUDENT' && ticket.studentId !== scope.studentId) throw Errors.forbidden();
  if (scope.role === 'STAFF' && ticket.departmentId !== scope.departmentId) throw Errors.forbidden();

  return ticket;
}

export async function updateTicketStatus(
  ticketId: string,
  userId: string,
  data: z.infer<typeof updateStatusSchema>,
  scope: { role: string; studentId?: string; departmentId?: string },
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw Errors.notFound('Ticket');

  if (scope.role === 'STAFF' && ticket.departmentId !== scope.departmentId) throw Errors.forbidden();
  if (scope.role === 'STUDENT') throw Errors.forbidden('Students cannot change ticket status.');

  const allowed = TICKET_TRANSITIONS[ticket.status as TicketStatus];
  if (!allowed.includes(data.status as TicketStatus)) {
    throw Errors.badRequest(`Cannot transition from ${ticket.status} to ${data.status}.`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: data.status as TicketStatus,
        ...(data.status === 'RESOLVED' && { resolvedAt: new Date() }),
        ...(data.status === 'CLOSED' && { closedAt: new Date() }),
      },
      include: TICKET_INCLUDE,
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        oldStatus: ticket.status,
        newStatus: data.status as TicketStatus,
        remark: data.remark,
        changedBy: userId,
      },
    });

    return updated;
  });
}

export async function addRemark(
  ticketId: string,
  userId: string,
  data: z.infer<typeof addRemarkSchema>,
  scope: { role: string; studentId?: string; departmentId?: string },
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw Errors.notFound('Ticket');

  if (scope.role === 'STUDENT' && ticket.studentId !== scope.studentId) throw Errors.forbidden();
  if (scope.role === 'STAFF' && ticket.departmentId !== scope.departmentId) throw Errors.forbidden();

  return prisma.ticketRemark.create({
    data: { ticketId, userId, remark: data.remark },
    include: {
      user: { select: { id: true, role: true, staffProfile: { select: { fullName: true } }, student: { select: { fullName: true } } } },
    },
  });
}

export async function getTicketHistory(ticketId: string, scope: { role: string; studentId?: string; departmentId?: string }) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw Errors.notFound('Ticket');

  if (scope.role === 'STUDENT' && ticket.studentId !== scope.studentId) throw Errors.forbidden();
  if (scope.role === 'STAFF' && ticket.departmentId !== scope.departmentId) throw Errors.forbidden();

  return prisma.ticketStatusHistory.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, role: true, staffProfile: { select: { fullName: true } }, student: { select: { fullName: true } } } },
    },
  });
}

export async function serveAttachment(attachmentId: string, scope: { role: string; studentId?: string; departmentId?: string }) {
  const att = await prisma.ticketAttachment.findUnique({
    where: { id: attachmentId },
    include: { ticket: true },
  });
  if (!att) throw Errors.notFound('Attachment');

  if (scope.role === 'STUDENT' && att.ticket.studentId !== scope.studentId) throw Errors.forbidden();
  if (scope.role === 'STAFF' && att.ticket.departmentId !== scope.departmentId) throw Errors.forbidden();

  const buffer = await storageService.readFile(att.storagePath);
  return { buffer, mimeType: att.mimeType, filename: att.originalFilename };
}
