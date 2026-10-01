'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Loader2, AlertCircle, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  departmentId: z.string().uuid(),
  name: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

export default function AdminIssuesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: deptData } = useQuery<{ data: any[] }>({
    queryKey: ['departments-list'],
    queryFn: () => api.get('/departments?pageSize=100'),
  });

  const { data, isLoading } = useQuery<{ data: any[]; pagination: any }>({
    queryKey: ['admin-issues', page],
    queryFn: () => api.get(`/issues?page=${page}&pageSize=20`),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: FormData) => api.post('/issues', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-issues'] }); setOpen(false); reset(); toast({ variant: 'success', title: 'Issue created' }); },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  const departments = deptData?.data ?? [];
  const issues = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Issue Categories"
        description="Manage issue categories for each department"
        breadcrumb={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Issues' }]}
        actions={<Button onClick={() => { setOpen(true); reset(); }}><PlusCircle className="h-4 w-4" />Add Issue</Button>}
      />

      <Card>
        {isLoading ? <TableSkeleton /> : issues.length === 0 ? (
          <EmptyState icon={AlertCircle} title="No issues found" action={<Button onClick={() => setOpen(true)}>Add Issue</Button>} />
        ) : (
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Issue</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {issues.map((i: any) => (
                  <tr key={i.id} className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{i.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{i.department?.name}</td>
                    <td className="py-3 px-4"><Badge variant={i.isActive ? 'success' : 'secondary'}>{i.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination?.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-xs text-muted-foreground">Page {page} of {pagination.totalPages} ({pagination.total} total)</span>
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
        <DialogContent>
          <DialogHeader><DialogTitle>Add Issue Category</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Department *</Label>
              <Select onValueChange={v => setValue('departmentId', v)}>
                <SelectTrigger><SelectValue placeholder="Select department…" /></SelectTrigger>
                <SelectContent>{departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.departmentId && <p className="text-xs text-destructive">Select a department</p>}
            </div>
            <div className="space-y-1.5"><Label>Issue Name *</Label><Input placeholder="WiFi not working" {...register('name')} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} {...register('description')} /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
