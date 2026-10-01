import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';

export async function getMyProfile(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      _count: { select: { tickets: true, applications: true } },
    },
  });
  if (!student) throw Errors.notFound('Student');
  return student;
}

export async function updateMyProfile(studentId: string, data: { phone?: string; email?: string }) {
  return prisma.student.update({
    where: { id: studentId },
    data,
  });
}

export async function getStudentDashboard(studentId: string) {
  const [
    openTickets,
    inProgressTickets,
    resolvedTickets,
    pendingApplications,
    completedApplications,
    recentTickets,
    recentApplications,
  ] = await Promise.all([
    prisma.ticket.count({ where: { studentId, status: 'OPEN' } }),
    prisma.ticket.count({ where: { studentId, status: { in: ['IN_PROGRESS', 'WAITING_FOR_STUDENT'] } } }),
    prisma.ticket.count({ where: { studentId, status: { in: ['RESOLVED', 'CLOSED'] } } }),
    prisma.application.count({ where: { studentId, status: { in: ['APPLICATION_SUBMITTED', 'WAITING_FOR_PAYMENT', 'PAYMENT_RECEIVED', 'UNDER_PROCESS'] } } }),
    prisma.application.count({ where: { studentId, status: 'COMPLETED' } }),
    prisma.ticket.findMany({
      where: { studentId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { name: true } },
        issue: { select: { name: true } },
      },
    }),
    prisma.application.findMany({
      where: { studentId },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    stats: { openTickets, inProgressTickets, resolvedTickets, pendingApplications, completedApplications },
    recentTickets,
    recentApplications,
  };
}
