import * as argon2 from 'argon2';
import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';
import type { z } from 'zod';
import type { createStaffSchema, updateStaffSchema, updateFeeConfigSchema, adminQuerySchema, reportQuerySchema } from './admin.schema';

export async function getAdminDashboard() {
  const [
    totalStudents,
    totalStaff,
    totalDepartments,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    closedTickets,
    pendingApplications,
    completedApplications,
    ticketsByDepartment,
    ticketsByStatus,
    appsByType,
    appsByStatus,
    monthlyTickets,
  ] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.staffProfile.count({ where: { isActive: true } }),
    prisma.department.count({ where: { isActive: true } }),
    prisma.ticket.count({ where: { status: 'OPEN' } }),
    prisma.ticket.count({ where: { status: { in: ['IN_PROGRESS', 'WAITING_FOR_STUDENT'] } } }),
    prisma.ticket.count({ where: { status: 'RESOLVED' } }),
    prisma.ticket.count({ where: { status: 'CLOSED' } }),
    prisma.application.count({ where: { status: { in: ['APPLICATION_SUBMITTED', 'WAITING_FOR_PAYMENT', 'PAYMENT_RECEIVED', 'UNDER_PROCESS', 'READY_FOR_COLLECTION'] } } }),
    prisma.application.count({ where: { status: 'COMPLETED' } }),
    // Chart: tickets by department
    prisma.ticket.groupBy({
      by: ['departmentId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    // Chart: tickets by status
    prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    // Chart: applications by type
    prisma.application.groupBy({
      by: ['applicationType'],
      _count: { id: true },
    }),
    // Chart: applications by status
    prisma.application.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    // Chart: monthly ticket volume (last 6 months)
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as month, COUNT(*) as count
      FROM tickets
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt"), TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY')
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `,
  ]);

  // Enrich tickets by department with names
  const deptIds = ticketsByDepartment.map(t => t.departmentId);
  const depts = await prisma.department.findMany({
    where: { id: { in: deptIds } },
    select: { id: true, name: true },
  });
  const deptMap = Object.fromEntries(depts.map(d => [d.id, d.name]));

  return {
    stats: {
      totalStudents,
      totalStaff,
      totalDepartments,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      pendingApplications,
      completedApplications,
    },
    charts: {
      ticketsByDepartment: ticketsByDepartment.map(t => ({
        name: deptMap[t.departmentId] ?? 'Unknown',
        count: t._count.id,
      })),
      ticketsByStatus: ticketsByStatus.map(t => ({
        status: t.status,
        count: t._count.id,
      })),
      appsByType: appsByType.map(a => ({
        type: a.applicationType,
        count: a._count.id,
      })),
      appsByStatus: appsByStatus.map(a => ({
        status: a.status,
        count: a._count.id,
      })),
      monthlyTickets: monthlyTickets.map(r => ({
        month: r.month,
        count: Number(r.count),
      })),
    },
  };
}

export async function listStudents(query: z.infer<typeof adminQuerySchema>) {
  const { page, pageSize, search, isActive } = query;
  const where = {
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { seatNumber: { contains: search, mode: 'insensitive' as const } },
        { fullName: { contains: search, mode: 'insensitive' as const } },
        { program: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tickets: true, applications: true } } },
    }),
    prisma.student.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export async function listStaff(query: z.infer<typeof adminQuerySchema>) {
  const { page, pageSize, search, isActive } = query;
  const where = {
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' as const } },
        { employeeId: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.staffProfile.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, email: true, lastLoginAt: true, isActive: true } },
      },
    }),
    prisma.staffProfile.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export async function createStaff(data: z.infer<typeof createStaffSchema>) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw Errors.conflict('A user with this email already exists.');

  const empExists = await prisma.staffProfile.findUnique({ where: { employeeId: data.employeeId } });
  if (empExists) throw Errors.conflict('A staff member with this employee ID already exists.');

  const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
  if (!dept) throw Errors.notFound('Department');

  const passwordHash = await argon2.hash(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: 'STAFF',
      isActive: true,
    },
  });

  const staff = await prisma.staffProfile.create({
    data: {
      userId: user.id,
      departmentId: data.departmentId,
      fullName: data.fullName,
      employeeId: data.employeeId,
      phone: data.phone,
    },
    include: {
      department: { select: { id: true, name: true, code: true } },
      user: { select: { id: true, email: true, isActive: true } },
    },
  });

  return staff;
}

export async function updateStaff(staffId: string, data: z.infer<typeof updateStaffSchema>) {
  const staff = await prisma.staffProfile.findUnique({ where: { id: staffId } });
  if (!staff) throw Errors.notFound('Staff member');

  if (data.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) throw Errors.notFound('Department');
  }

  const { isActive, ...profileData } = data;

  const updated = await prisma.staffProfile.update({
    where: { id: staffId },
    data: {
      ...profileData,
      ...(isActive !== undefined && {
        isActive,
        user: { update: { isActive } },
      }),
    },
    include: {
      department: { select: { id: true, name: true, code: true } },
      user: { select: { id: true, email: true, isActive: true } },
    },
  });

  return updated;
}

export async function getFeeConfigurations() {
  return prisma.feeConfiguration.findMany({
    orderBy: [{ applicationType: 'asc' }, { office: 'asc' }],
  });
}

export async function updateFeeConfiguration(id: string, data: z.infer<typeof updateFeeConfigSchema>) {
  const config = await prisma.feeConfiguration.findUnique({ where: { id } });
  if (!config) throw Errors.notFound('Fee configuration');
  return prisma.feeConfiguration.update({ where: { id }, data });
}

export async function getTicketReport(query: z.infer<typeof reportQuerySchema>) {
  const where: Record<string, unknown> = {};
  if (query.departmentId) where['departmentId'] = query.departmentId;
  if (query.status) where['status'] = query.status;
  if (query.dateFrom || query.dateTo) {
    where['createdAt'] = {
      ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
      ...(query.dateTo && { lte: new Date(query.dateTo) }),
    };
  }

  const [total, byStatus, byDept, tickets] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({ by: ['status'], where, _count: { id: true } }),
    prisma.ticket.groupBy({ by: ['departmentId'], where, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.ticket.findMany({
      where,
      take: 1000,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { seatNumber: true, fullName: true, program: true } },
        department: { select: { name: true } },
        issue: { select: { name: true } },
      },
    }),
  ]);

  const deptIds = byDept.map(d => d.departmentId);
  const depts = await prisma.department.findMany({ where: { id: { in: deptIds } }, select: { id: true, name: true } });
  const deptMap = Object.fromEntries(depts.map(d => [d.id, d.name]));

  return {
    summary: {
      total,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
      byDepartment: byDept.map(d => ({ department: deptMap[d.departmentId] ?? 'Unknown', count: d._count.id })),
    },
    tickets,
  };
}

export async function getApplicationReport(query: z.infer<typeof reportQuerySchema>) {
  const where: Record<string, unknown> = {};
  if (query.status) where['status'] = query.status;
  if (query.applicationType) where['applicationType'] = query.applicationType;
  if (query.office) where['office'] = query.office;
  if (query.dateFrom || query.dateTo) {
    where['createdAt'] = {
      ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
      ...(query.dateTo && { lte: new Date(query.dateTo) }),
    };
  }

  const [total, byStatus, byType, applications] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.groupBy({ by: ['status'], where, _count: { id: true } }),
    prisma.application.groupBy({ by: ['applicationType'], where, _count: { id: true } }),
    prisma.application.findMany({
      where,
      take: 1000,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { seatNumber: true, fullName: true, program: true } },
      },
    }),
  ]);

  return {
    summary: {
      total,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
      byType: byType.map(t => ({ type: t.applicationType, count: t._count.id })),
    },
    applications,
  };
}

export async function getAuditLogs(page: number, pageSize: number, userId?: string, action?: string) {
  const where = {
    ...(userId && { userId }),
    ...(action && { action: { contains: action, mode: 'insensitive' as const } }),
  };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true, email: true, role: true,
            staffProfile: { select: { fullName: true } },
            student: { select: { fullName: true, seatNumber: true } },
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, page, pageSize, total };
}
