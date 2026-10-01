'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

const schema = z.object({
  baseFee: z.coerce.number().positive(),
  perSemesterFee: z.coerce.number().positive(),
});
type FormData = z.infer<typeof schema>;

const LABELS: Record<string, string> = {
  'PROFORMA_REGISTRAR_OFFICE': "Proforma — Registrar's Office",
  'PROFORMA_SEMESTER_CELL': 'Proforma — Semester Cell',
  'TRANSCRIPT_REGISTRAR_OFFICE': "Transcript — Registrar's Office",
  'TRANSCRIPT_SEMESTER_CELL': 'Transcript — Semester Cell',
};

export default function AdminFeesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['fee-configs'],
    queryFn: () => api.get('/admin/fee-configurations'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.patch(`/admin/fee-configurations/${id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-configs'] });
      setEditing(null);
      toast({ variant: 'success', title: 'Fee configuration updated' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  const configs = data?.data ?? [];

  function openEdit(config: any) {
    setEditing(config);
    setValue('baseFee', Number(config.baseFee));
    setValue('perSemesterFee', Number(config.perSemesterFee));
  }

  return (
    <div>
      <PageHeader
        title="Fee Configuration"
        description="Configure application fees (demo values — not official UoK rates)"
        breadcrumb={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Fee Config' }]}
      />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
        ⚠ These are configurable demo values only. They do not represent official University of Karachi fee structures.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)
        ) : (
          configs.map((config: any) => {
            const key = `${config.applicationType}_${config.office}`;
            const label = LABELS[key] ?? key;
            const total6 = Number(config.baseFee) + 6 * Number(config.perSemesterFee);
            return (
              <Card key={config.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Base Fee</p>
                      <p className="font-semibold">{formatCurrency(config.baseFee)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Per Semester</p>
                      <p className="font-semibold">{formatCurrency(config.perSemesterFee)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Example (6 semesters): {formatCurrency(total6)}</p>
                  <Button variant="outline" size="sm" onClick={() => openEdit(config)}>Edit Fees</Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Fee Configuration</DialogTitle>
            <p className="text-xs text-muted-foreground">{editing && LABELS[`${editing.applicationType}_${editing.office}`]}</p>
          </DialogHeader>
          <form onSubmit={handleSubmit(d => updateMutation.mutate({ id: editing?.id, ...d }))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Base Fee (Rs.) *</Label>
              <Input type="number" step="0.01" min="0" {...register('baseFee')} />
              {errors.baseFee && <p className="text-xs text-destructive">{errors.baseFee.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Per Semester Fee (Rs.) *</Label>
              <Input type="number" step="0.01" min="0" {...register('perSemesterFee')} />
              {errors.perSemesterFee && <p className="text-xs text-destructive">{errors.perSemesterFee.message}</p>}
            </div>
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
