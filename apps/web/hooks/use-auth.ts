'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, type AuthUser } from '@/lib/auth';

export function useAuth(requiredRole?: string | string[]) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/login');
      return;
    }
    const roles = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : null;
    if (roles && !roles.includes(stored.role)) {
      // Redirect to their correct dashboard
      if (stored.role === 'STUDENT') router.replace('/student/dashboard');
      else if (stored.role === 'STAFF') router.replace('/staff/dashboard');
      else router.replace('/admin/dashboard');
      return;
    }
    setUser(stored);
    setChecking(false);
  }, [router, requiredRole]);

  return { user, checking };
}
