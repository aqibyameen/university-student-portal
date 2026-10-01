'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace('/login'); return; }
    if (user.role === 'STUDENT') router.replace('/student/dashboard');
    else if (user.role === 'STAFF') router.replace('/staff/dashboard');
    else router.replace('/admin/dashboard');
  }, [router]);
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
