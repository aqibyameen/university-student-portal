'use client';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/use-auth';

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { user, checking } = useAuth('STUDENT');
  if (checking || !user) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  return <AppShell user={user}>{children}</AppShell>;
}
