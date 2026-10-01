import * as argon2 from 'argon2';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { Errors } from '../../lib/errors';
import { env } from '../../config/env';
import type { AccessTokenPayload } from '../../lib/jwt';

// Hash a refresh token before storing
function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function issueTokenPair(userId: string, payload: AccessTokenPayload) {
  const accessToken = signAccessToken(payload);

  const rawRefresh = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(rawRefresh);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86400_000);

  const record = await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  const refreshToken = signRefreshToken({ sub: userId, jti: record.id });

  // We send the raw refresh token to the client (not the hash)
  return { accessToken, refreshToken: rawRefresh };
}

export async function studentLogin(seatNumber: string, password: string) {
  const student = await prisma.student.findUnique({
    where: { seatNumber },
    include: { user: true },
  });

  if (!student || !student.isActive || !student.user.isActive) {
    throw Errors.unauthorized('Invalid seat number or password.');
  }

  const valid = await argon2.verify(student.user.passwordHash, password);
  if (!valid) throw Errors.unauthorized('Invalid seat number or password.');

  await prisma.user.update({
    where: { id: student.userId },
    data: { lastLoginAt: new Date() },
  });

  const payload: AccessTokenPayload = {
    sub: student.userId,
    role: 'STUDENT',
    studentId: student.id,
  };

  const tokens = await issueTokenPair(student.userId, payload);

  return {
    ...tokens,
    user: {
      id: student.userId,
      role: 'STUDENT',
      student: {
        id: student.id,
        seatNumber: student.seatNumber,
        fullName: student.fullName,
        email: student.email,
        program: student.program,
        department: student.department,
        semester: student.semester,
      },
    },
  };
}

export async function staffLogin(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { staffProfile: { include: { department: true } } },
  });

  if (!user || !user.isActive || !['STAFF', 'ADMIN'].includes(user.role)) {
    throw Errors.unauthorized('Invalid email or password.');
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) throw Errors.unauthorized('Invalid email or password.');

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const payload: AccessTokenPayload = {
    sub: user.id,
    role: user.role,
    staffDeptId: user.staffProfile?.departmentId,
  };

  const tokens = await issueTokenPair(user.id, payload);

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      staffProfile: user.staffProfile
        ? {
            id: user.staffProfile.id,
            fullName: user.staffProfile.fullName,
            employeeId: user.staffProfile.employeeId,
            department: user.staffProfile.department,
          }
        : null,
    },
  };
}

export async function refresh(rawToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw Errors.unauthorized('Invalid or expired refresh token.');
  }

  const tokenHash = hashToken(rawToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw Errors.unauthorized('Refresh token is invalid or has been revoked.');
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      student: true,
      staffProfile: true,
    },
  });

  if (!user || !user.isActive) throw Errors.unauthorized('Account is inactive.');

  const newPayload: AccessTokenPayload = {
    sub: user.id,
    role: user.role,
    studentId: user.student?.id,
    staffDeptId: user.staffProfile?.departmentId,
  };

  return issueTokenPair(user.id, newPayload);
}

export async function logout(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: true,
      staffProfile: { include: { department: true } },
    },
  });
  if (!user) throw Errors.notFound('User');
  const { passwordHash: _pw, ...safe } = user;
  return safe;
}
