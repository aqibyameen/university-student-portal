'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { saveAuth, type AuthUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

type Tab = 'student' | 'staff';

const studentSchema = z.object({
  seatNumber: z.string().min(3, 'Enter your seat number'),
  password: z.string().min(1, 'Password is required'),
});

const staffSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type StudentForm = z.infer<typeof studentSchema>;
type StaffForm = z.infer<typeof staffSchema>;

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('student');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const studentForm = useForm<StudentForm>({ resolver: zodResolver(studentSchema) });
  const staffForm = useForm<StaffForm>({ resolver: zodResolver(staffSchema) });

  async function onStudentSubmit(data: StudentForm) {
    setLoading(true);
    try {
      const res = await api.post<{ success: true; data: { accessToken: string; refreshToken: string; user: AuthUser } }>(
        '/auth/student/login', data,
      );
      saveAuth(res.data.accessToken, res.data.refreshToken, res.data.user);
      router.push('/student/dashboard');
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: 'Login failed', description: (err as Error).message });
    } finally { setLoading(false); }
  }

  async function onStaffSubmit(data: StaffForm) {
    setLoading(true);
    try {
      const res = await api.post<{ success: true; data: { accessToken: string; refreshToken: string; user: AuthUser } }>(
        '/auth/staff/login', data,
      );
      saveAuth(res.data.accessToken, res.data.refreshToken, res.data.user);
      if (res.data.user.role === 'ADMIN') router.push('/admin/dashboard');
      else router.push('/staff/dashboard');
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: 'Login failed', description: (err as Error).message });
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary shadow-lg mb-4">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">University of Karachi</h1>
          <p className="text-sm text-muted-foreground mt-1">Student Issue Management & Document Portal</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign in</CardTitle>
            <CardDescription>Access your portal account</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                type="button"
                onClick={() => setTab('student')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  tab === 'student' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setTab('staff')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  tab === 'staff' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Staff / Admin
              </button>
            </div>

            {/* Student Form */}
            {tab === 'student' && (
              <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="seatNumber">Seat Number</Label>
                  <Input
                    id="seatNumber"
                    placeholder="e.g. CS-2026-001"
                    {...studentForm.register('seatNumber')}
                    autoComplete="username"
                  />
                  {studentForm.formState.errors.seatNumber && (
                    <p className="text-xs text-destructive">{studentForm.formState.errors.seatNumber.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw-student">Password</Label>
                  <div className="relative">
                    <Input
                      id="pw-student"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...studentForm.register('password')}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {studentForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{studentForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in as Student
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Demo: <code className="bg-muted px-1 rounded">CS-2026-001</code> / <code className="bg-muted px-1 rounded">Student123!</code>
                </p>
              </form>
            )}

            {/* Staff Form */}
            {tab === 'staff' && (
              <form onSubmit={staffForm.handleSubmit(onStaffSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@portal.edu"
                    {...staffForm.register('email')}
                    autoComplete="email"
                  />
                  {staffForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{staffForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw-staff">Password</Label>
                  <div className="relative">
                    <Input
                      id="pw-staff"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...staffForm.register('password')}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {staffForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{staffForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in as Staff / Admin
                </Button>
                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>Admin: <code className="bg-muted px-1 rounded">admin@portal.edu</code> / <code className="bg-muted px-1 rounded">ChangeMe123!</code></p>
                  <p>Staff: <code className="bg-muted px-1 rounded">it.staff@portal.edu</code> / <code className="bg-muted px-1 rounded">Staff123!</code></p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          ⚠ Demo system — not an official University of Karachi service
        </p>
      </div>
    </div>
  );
}
