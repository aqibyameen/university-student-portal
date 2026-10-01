'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Loader2, Building2, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20),
  description: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

export default function AdminDepartmentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['admin-departments'],
    queryFn: () => api.get('/departments?pageSize=100&isActive=true'),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: FormData) => api.post('/departments', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-departments'] }); setOpen(false); reset(); toast({ variant: 'success', title: 'Department created' }); },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.patch(`/departments/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-departments'] }); setEditing(null); reset(); toast({ variant: 'success', title: 'Department updated' }); },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  const departments = data?.data ?? [];

  function openEdit(dept: any) {
    setEditing(dept);
    setValue('name', dept.name);
    setValue('code', dept.code);
    setValue('description', dept.description ?? '');
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Manage university departments"
        breadcrumb={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Departments' }]}
        actions={
          <Button onClick={() => { setOpen(true); reset(); }}>
            <PlusCircle className="h-4 w-4" />
            Add Department
          </Button>
        }
      />

      <Card>
        {isLoading ? <TableSkeleton /> : departments.length === 0 ? (
          <EmptyState icon={Building2} title="No departments" action={<Button onClick={() => setOpen(true)}>Add Department</Button>} />
        ) : (
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Issues</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {departments.map((d: any) => (
                  <tr key={d.id} className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{d.name}</td>
                    <td className="py-3 px-4 font-mono text-xs">{d.code}</td>
                    <td className="py-3 px-4 text-muted-foreground">{d._count?.issues ?? '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={d.isActive ? 'success' : 'secondary'}>{d.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        )}
      </Card>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5"><Label>Name *</Label><Input placeholder="IT Department / Computer Centre" {...register('name')} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
            <div className="space-y-1.5"><Label>Code *</Label><Input placeholder="IT" {...register('code')} />{errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}</div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} {...register('description')} /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Department</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(d => updateMutation.mutate({ id: editing?.id, ...d }))} className="space-y-4">
            <div className="space-y-1.5"><Label>Name *</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
            <div className="space-y-1.5"><Label>Code *</Label><Input {...register('code')} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} {...register('description')} /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
