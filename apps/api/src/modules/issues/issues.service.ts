import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';
import type { z } from 'zod';
import type { createIssueSchema, updateIssueSchema } from './issues.schema';

export async function listIssuesByDepartment(departmentId: string, activeOnly = true) {
  const dept = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!dept) throw Errors.notFound('Department');
  return prisma.issue.findMany({
    where: { departmentId, ...(activeOnly && { isActive: true }) },
    orderBy: { name: 'asc' },
  });
}

export async function createIssue(data: z.infer<typeof createIssueSchema>) {
  const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
  if (!dept) throw Errors.notFound('Department');
  const exists = await prisma.issue.findUnique({
    where: { departmentId_name: { departmentId: data.departmentId, name: data.name } },
  });
  if (exists) throw Errors.conflict('An issue with this name already exists for this department.');
  return prisma.issue.create({ data });
}

export async function updateIssue(id: string, data: z.infer<typeof updateIssueSchema>) {
  const issue = await prisma.issue.findUnique({ where: { id } });
  if (!issue) throw Errors.notFound('Issue');
  return prisma.issue.update({ where: { id }, data });
}

export async function listAllIssues(page: number, pageSize: number, search?: string) {
  const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
  const [items, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
      include: { department: { select: { id: true, name: true, code: true } } },
    }),
    prisma.issue.count({ where }),
  ]);
  return { items, page, pageSize, total };
}
