import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';
import type { z } from 'zod';
import type { createDepartmentSchema, updateDepartmentSchema, departmentQuerySchema } from './departments.schema';

export async function listDepartments(query: z.infer<typeof departmentQuerySchema>) {
  const { page, pageSize, search, isActive } = query;
  const where = {
    ...(isActive !== undefined && { isActive }),
    ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
  };
  const [items, total] = await Promise.all([
    prisma.department.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
      include: { _count: { select: { issues: true, tickets: true, staff: true } } },
    }),
    prisma.department.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export async function getDepartment(id: string) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: {
      issues: { where: { isActive: true }, orderBy: { name: 'asc' } },
      _count: { select: { tickets: true, staff: true } },
    },
  });
  if (!dept) throw Errors.notFound('Department');
  return dept;
}

export async function createDepartment(data: z.infer<typeof createDepartmentSchema>) {
  const existing = await prisma.department.findFirst({
    where: { OR: [{ name: data.name }, { code: data.code }] },
  });
  if (existing) throw Errors.conflict('A department with this name or code already exists.');
  return prisma.department.create({ data });
}

export async function updateDepartment(id: string, data: z.infer<typeof updateDepartmentSchema>) {
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) throw Errors.notFound('Department');
  return prisma.department.update({ where: { id }, data });
}
