'use client';

export interface AuthUser {
  id: string;
  role: 'STUDENT' | 'STAFF' | 'ADMIN';
  email?: string;
  student?: {
    id: string;
    seatNumber: string;
    fullName: string;
    email?: string;
    program: string;
    department: string;
    semester: number;
    phone?: string;
  };
  staffProfile?: {
    id: string;
    fullName: string;
    employeeId: string;
    department: { id: string; name: string; code: string };
  };
}

export function saveAuth(accessToken: string, refreshToken: string, user: AuthUser) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function getDisplayName(user: AuthUser): string {
  if (user.student) return user.student.fullName;
  if (user.staffProfile) return user.staffProfile.fullName;
  return user.email ?? 'Admin';
}
