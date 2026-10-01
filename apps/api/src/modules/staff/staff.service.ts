import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';

export async function getStaffDashboard(departmentId: string) {
  const dept = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!dept) throw Errors.notFound('Department');

  // Determine which office this staff manages for applications
  const officeFilter =
    dept.code === 'REGISTRAR' ? 'REGISTRAR_OFFICE' :
    dept.code === 'SEMESTER' ? 'SEMESTER_CELL' : null;

  const [
    openTickets,
    inProgressTickets,
    waitingTickets,
    resolvedTickets,
    pendingApplications,
    recentTickets,
    recentApplications,
  ] = await Promise.all([
    prisma.ticket.count({ where: { departmentId, status: 'OPEN' } }),
    prisma.ticket.count({ where: { departmentId, status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { departmentId, status: 'WAITING_FOR_STUDENT' } }),
    prisma.ticket.count({ where: { departmentId, status: { in: ['RESOLVED', 'CLOSED'] } } }),
    officeFilter
      ? prisma.application.count({ where: { office: officeFilter as any, status: { in: ['PAYMENT_RECEIVED', 'UNDER_PROCESS'] } } })
      : 0,
    prisma.ticket.findMany({
      where: { departmentId },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { seatNumber: true, fullName: true, program: true } },
        issue: { select: { name: true } },
      },
    }),
    officeFilter
      ? prisma.application.findMany({
          where: { office: officeFilter as any },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: { student: { select: { seatNumber: true, fullName: true } } },
        })
      : [],
  ]);

  return {
    department: { id: dept.id, name: dept.name, code: dept.code },
    stats: { openTickets, inProgressTickets, waitingTickets, resolvedTickets, pendingApplications },
    recentTickets,
    recentApplications,
  };
}
