'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Loader2, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  departmentId: z.string().uuid(),
  employeeId: z.string().min(2),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AdminStaffPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: deptData } = useQuery<{ data: any[] }>({
    queryKey: ['departments-list'],
    queryFn: () => api.get('/departments?pageSize=100'),
  });

  const { data, isLoading } = useQuery<{ data: any[]; pagination: any }>({
    queryKey: ['admin-staff', search, page],
    queryFn: () => api.get(`/admin/staff?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: FormData) => api.post('/admin/staff', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-staff'] }); setOpen(false); reset(); toast({ variant: 'success', title: 'Staff account created' }); },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  const staff = data?.data ?? [];
  const pagination = data?.pagination;
  const departments = deptData?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Staff Management"
        description="Manage staff accounts and department assignments"
        breadcrumb={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Staff' }]}
        actions={<Button onClick={() => { setOpen(true); reset(); }}><PlusCircle className="h-4 w-4" />Add Staff</Button>}
      />

      <div className="mb-4">
        <Input placeholder="Search by name or employee ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
      </div>

      <Card>
        {isLoading ? <TableSkeleton /> : staff.length === 0 ? (
          <EmptyState icon={Shield} title="No staff found" action={<Button onClick={() => setOpen(true)}>Add Staff</Button>} />
        ) : (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Employee ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {staff.map((s: any) => (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium">{s.fullName}</td>
                      <td className="py-3 px-4 font-mono text-xs">{s.employeeId}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{s.department?.name}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{s.user?.email}</td>
                      <td className="py-3 px-4"><Badge variant={s.isActive ? 'success' : 'secondary'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{s.user?.lastLoginAt ? formatDate(s.user.lastLoginAt) : 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination?.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-xs text-muted-foreground">Page {page} of {pagination.totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Staff Account</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input placeholder="Dr. Ahmed Hassan" {...register('fullName')} />{errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}</div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" placeholder="staff@portal.edu" {...register('email')} />{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}</div>
            <div className="space-y-1.5"><Label>Password * (min 8 chars)</Label><Input type="password" {...register('password')} />{errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}</div>
            <div className="space-y-1.5"><Label>Employee ID *</Label><Input placeholder="EMP-IT-002" {...register('employeeId')} /></div>
            <div className="space-y-1.5">
              <Label>Department *</Label>
              <Select onValueChange={v => setValue('departmentId', v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.departmentId && <p className="text-xs text-destructive">Select a department</p>}
            </div>
            <div className="space-y-1.5"><Label>Phone</Label><Input placeholder="03xx-xxxxxxx" {...register('phone')} /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Create Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
