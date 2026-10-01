import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';
import { generateApplicationNumber } from '../../utils/ticketNumber';
import { storageService } from '../../storage/StorageService';
import { generateVoucherPDF } from './voucher.service';
import { APPLICATION_TRANSITIONS } from '@portal/types';
import type { ApplicationStatus } from '@prisma/client';
import type { z } from 'zod';
import type { createApplicationSchema, applicationQuerySchema, updateStatusSchema, addRemarkSchema } from './applications.schema';

const APP_INCLUDE = {
  student: true,
  receipt: true,
  statusHistory: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      user: { select: { id: true, role: true, staffProfile: { select: { fullName: true } }, student: { select: { fullName: true } } } },
    },
  },
  remarks: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      user: { select: { id: true, role: true, staffProfile: { select: { fullName: true } }, student: { select: { fullName: true } } } },
    },
  },
};

export async function createApplication(
  studentId: string,
  userId: string,
  data: z.infer<typeof createApplicationSchema>,
) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw Errors.notFound('Student');

  // Get fee configuration
  const feeConfig = await prisma.feeConfiguration.findUnique({
    where: {
      applicationType_office: {
        applicationType: data.applicationType,
        office: data.office,
      },
    },
  });
  if (!feeConfig || !feeConfig.isActive) {
    throw Errors.badRequest('Fee configuration not available for the selected application type and office.');
  }

  const baseFee = Number(feeConfig.baseFee);
  const perSemesterFee = Number(feeConfig.perSemesterFee);
  const totalFee = baseFee + data.numberOfSemesters * perSemesterFee;

  const count = await prisma.application.count();
  const applicationNumber = generateApplicationNumber(count + 1);

  return prisma.$transaction(async (tx) => {
    const application = await tx.application.create({
      data: {
        applicationNumber,
        studentId,
        office: data.office,
        applicationType: data.applicationType,
        numberOfSemesters: data.numberOfSemesters,
        purpose: data.purpose,
        notes: data.notes,
        baseFee,
        perSemesterFee,
        totalFee,
        status: 'APPLICATION_SUBMITTED',
      },
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        oldStatus: null,
        newStatus: 'APPLICATION_SUBMITTED',
        remark: 'Application submitted.',
        changedBy: userId,
      },
    });

    // Auto-transition to WAITING_FOR_PAYMENT
    const updated = await tx.application.update({
      where: { id: application.id },
      data: { status: 'WAITING_FOR_PAYMENT' },
      include: APP_INCLUDE,
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        oldStatus: 'APPLICATION_SUBMITTED',
        newStatus: 'WAITING_FOR_PAYMENT',
        remark: 'Awaiting fee payment. Please download the voucher and pay at the bank.',
        changedBy: userId,
      },
    });

    return updated;
  });
}

export async function listApplications(
  query: z.infer<typeof applicationQuerySchema>,
  scope: { role: string; studentId?: string; departmentId?: string },
) {
  const { page, pageSize, status, applicationType, office, studentId, search, dateFrom, dateTo, sortDirection } = query;

  const where: Record<string, unknown> = {};

  if (scope.role === 'STUDENT') {
    where['studentId'] = scope.studentId;
  } else if (scope.role === 'STAFF') {
    // Staff see applications for their office based on department code mapping
    const dept = await prisma.department.findUnique({ where: { id: scope.departmentId } });
    if (dept) {
      if (dept.code === 'REGISTRAR') where['office'] = 'REGISTRAR_OFFICE';
      else if (dept.code === 'SEMESTER') where['office'] = 'SEMESTER_CELL';
    }
  }

  if (status) where['status'] = status;
  if (applicationType) where['applicationType'] = applicationType;
  if (office && scope.role === 'ADMIN') where['office'] = office;
  if (studentId && scope.role === 'ADMIN') where['studentId'] = studentId;
  if (dateFrom || dateTo) {
    where['createdAt'] = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    };
  }
  if (search) {
    where['OR'] = [
      { applicationNumber: { contains: search, mode: 'insensitive' } },
      { purpose: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: sortDirection },
      include: {
        student: { select: { id: true, seatNumber: true, fullName: true, program: true, department: true } },
        receipt: { select: { id: true, createdAt: true } },
        _count: { select: { remarks: true } },
      },
    }),
    prisma.application.count({ where }),
  ]);

  return { items, page, pageSize, total };
}

export async function getApplication(
  applicationId: string,
  scope: { role: string; studentId?: string; departmentId?: string },
) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: APP_INCLUDE,
  });
  if (!app) throw Errors.notFound('Application');

  if (scope.role === 'STUDENT' && app.studentId !== scope.studentId) throw Errors.forbidden();
  if (scope.role === 'STAFF') {
    const dept = await prisma.department.findUnique({ where: { id: scope.departmentId } });
    if (dept) {
      const officeMatch =
        (dept.code === 'REGISTRAR' && app.office === 'REGISTRAR_OFFICE') ||
        (dept.code === 'SEMESTER' && app.office === 'SEMESTER_CELL');
      if (!officeMatch) throw Errors.forbidden();
    }
  }

  return app;
}

export async function updateApplicationStatus(
  applicationId: string,
  userId: string,
  data: z.infer<typeof updateStatusSchema>,
  scope: { role: string; studentId?: string; departmentId?: string },
) {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app) throw Errors.notFound('Application');

  if (scope.role === 'STUDENT') throw Errors.forbidden('Students cannot update application status directly.');

  if (scope.role === 'STAFF') {
    const dept = await prisma.department.findUnique({ where: { id: scope.departmentId } });
    if (dept) {
      const officeMatch =
        (dept.code === 'REGISTRAR' && app.office === 'REGISTRAR_OFFICE') ||
        (dept.code === 'SEMESTER' && app.office === 'SEMESTER_CELL');
      if (!officeMatch) throw Errors.forbidden();
    }
  }

  const allowed = APPLICATION_TRANSITIONS[app.status as ApplicationStatus];
  if (!allowed.includes(data.status as ApplicationStatus)) {
    throw Errors.badRequest(`Cannot transition from ${app.status} to ${data.status}.`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: applicationId },
      data: {
        status: data.status as ApplicationStatus,
        ...(data.status === 'COMPLETED' && { completedAt: new Date() }),
      },
      include: APP_INCLUDE,
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId,
        oldStatus: app.status,
        newStatus: data.status as ApplicationStatus,
        remark: data.remark,
        changedBy: userId,
      },
    });

    return updated;
  });
}

export async function addRemark(
  applicationId: string,
  userId: string,
  data: z.infer<typeof addRemarkSchema>,
  scope: { role: string; studentId?: string; departmentId?: string },
) {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app) throw Errors.notFound('Application');

  if (scope.role === 'STUDENT' && app.studentId !== scope.studentId) throw Errors.forbidden();

  return prisma.applicationRemark.create({
    data: { applicationId, userId, remark: data.remark },
    include: {
      user: { select: { id: true, role: true, staffProfile: { select: { fullName: true } }, student: { select: { fullName: true } } } },
    },
  });
}

export async function uploadReceipt(
  applicationId: string,
  userId: string,
  file: Express.Multer.File,
  scope: { role: string; studentId?: string },
) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { receipt: true },
  });
  if (!app) throw Errors.notFound('Application');

  if (scope.role === 'STUDENT' && app.studentId !== scope.studentId) throw Errors.forbidden();

  if (app.status !== 'WAITING_FOR_PAYMENT') {
    throw Errors.badRequest('Receipt can only be uploaded when application is waiting for payment.');
  }

  if (app.receipt) {
    throw Errors.conflict('A payment receipt has already been uploaded for this application.');
  }

  const stored = await storageService.savePaymentReceipt(file, applicationId);

  return prisma.$transaction(async (tx) => {
    const receipt = await tx.paymentReceipt.create({
      data: {
        applicationId,
        uploadedBy: userId,
        ...stored,
      },
    });

    await tx.application.update({
      where: { id: applicationId },
      data: { status: 'PAYMENT_RECEIVED' },
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId,
        oldStatus: 'WAITING_FOR_PAYMENT',
        newStatus: 'PAYMENT_RECEIVED',
        remark: 'Payment receipt uploaded by student.',
        changedBy: userId,
      },
    });

    return receipt;
  });
}

export async function getVoucher(
  applicationId: string,
  scope: { role: string; studentId?: string },
) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { student: true },
  });
  if (!app) throw Errors.notFound('Application');

  if (scope.role === 'STUDENT' && app.studentId !== scope.studentId) throw Errors.forbidden();

  const pdfBuffer = await generateVoucherPDF({ application: app as any });
  return { buffer: pdfBuffer, filename: `voucher-${app.applicationNumber}.pdf` };
}

export async function serveReceipt(
  applicationId: string,
  scope: { role: string; studentId?: string; departmentId?: string },
) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { receipt: true },
  });
  if (!app || !app.receipt) throw Errors.notFound('Payment receipt');

  if (scope.role === 'STUDENT' && app.studentId !== scope.studentId) throw Errors.forbidden();

  const buffer = await storageService.readFile(app.receipt.storagePath);
  return { buffer, mimeType: app.receipt.mimeType, filename: app.receipt.originalFilename };
}

export async function getApplicationHistory(
  applicationId: string,
  scope: { role: string; studentId?: string },
) {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app) throw Errors.notFound('Application');

  if (scope.role === 'STUDENT' && app.studentId !== scope.studentId) throw Errors.forbidden();

  return prisma.applicationStatusHistory.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, role: true, staffProfile: { select: { fullName: true } }, student: { select: { fullName: true } } } },
    },
  });
}
