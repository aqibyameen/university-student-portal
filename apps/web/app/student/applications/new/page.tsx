'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Calculator } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

const schema = z.object({
  office: z.enum(['REGISTRAR_OFFICE', 'SEMESTER_CELL']),
  applicationType: z.enum(['PROFORMA', 'TRANSCRIPT']),
  numberOfSemesters: z.coerce.number().int().min(1).max(20),
  purpose: z.string().min(5, 'Provide a purpose (min 5 chars)').max(500),
  notes: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

interface FeeConfig { id: string; applicationType: string; office: string; baseFee: string; perSemesterFee: string }

export default function NewApplicationPage() {
  const searchParams = useSearchParams();
  const defaultType = (searchParams.get('type') ?? 'TRANSCRIPT') as 'PROFORMA' | 'TRANSCRIPT';
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth('STUDENT');
  const qc = useQueryClient();
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { applicationType: defaultType, office: 'REGISTRAR_OFFICE', numberOfSemesters: 1 },
  });

  const watchedType = watch('applicationType');
  const watchedOffice = watch('office');
  const watchedSemesters = watch('numberOfSemesters');

  const { data: feeData } = useQuery<{ data: FeeConfig[] }>({
    queryKey: ['fee-configs'],
    queryFn: () => api.get('/admin/fee-configurations'),
  });

  const feeConfigs = feeData?.data ?? [];

  useEffect(() => {
    const config = feeConfigs.find(f => f.applicationType === watchedType && f.office === watchedOffice);
    if (config && watchedSemesters > 0) {
      const total = Number(config.baseFee) + watchedSemesters * Number(config.perSemesterFee);
      setCalculatedFee(total);
    }
  }, [watchedType, watchedOffice, watchedSemesters, feeConfigs]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/applications', data),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['student-applications'] });
      qc.invalidateQueries({ queryKey: ['student-dashboard'] });
      toast({ variant: 'success', title: 'Application submitted', description: `Application ${res.data.applicationNumber} created.` });
      router.push(`/student/applications/${res.data.id}`);
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Submission failed', description: err.message }),
  });

  const activeConfig = feeConfigs.find(f => f.applicationType === watchedType && f.office === watchedOffice);

  return (
    <div>
      <PageHeader
        title={`Apply for ${defaultType === 'PROFORMA' ? 'Proforma' : 'Transcript'}`}
        description="Fill the application form. The fee will be calculated automatically."
        breadcrumb={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Applications', href: '/student/applications' },
          { label: 'New' },
        ]}
      />

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="max-w-2xl space-y-6">
        {/* Student info (read-only) */}
        <Card>
          <CardHeader><CardTitle className="text-base">Student Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Full Name</p><p className="font-medium">{user?.student?.fullName}</p></div>
            <div><p className="text-xs text-muted-foreground">Seat Number</p><p className="font-medium">{user?.student?.seatNumber}</p></div>
            <div><p className="text-xs text-muted-foreground">Program</p><p className="font-medium">{user?.student?.program}</p></div>
            <div><p className="text-xs text-muted-foreground">Semester</p><p className="font-medium">Semester {user?.student?.semester}</p></div>
            <div><p className="text-xs text-muted-foreground">Department</p><p className="font-medium">{user?.student?.department}</p></div>
          </CardContent>
        </Card>

        {/* Application details */}
        <Card>
          <CardHeader><CardTitle className="text-base">Application Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Application Type *</Label>
                <Select defaultValue={defaultType} onValueChange={v => setValue('applicationType', v as FormData['applicationType'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROFORMA">Proforma</SelectItem>
                    <SelectItem value="TRANSCRIPT">Transcript</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Office *</Label>
                <Select defaultValue="REGISTRAR_OFFICE" onValueChange={v => setValue('office', v as FormData['office'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGISTRAR_OFFICE">Registrar&apos;s Office</SelectItem>
                    <SelectItem value="SEMESTER_CELL">Semester Cell</SelectItem>
                  </SelectContent>
                </Select>
                {errors.office && <p className="text-xs text-destructive">{errors.office.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="semesters">Number of Semesters *</Label>
              <Input
                id="semesters"
                type="number"
                min={1}
                max={20}
                {...register('numberOfSemesters')}
                className="max-w-[120px]"
              />
              {errors.numberOfSemesters && <p className="text-xs text-destructive">{errors.numberOfSemesters.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Purpose *</Label>
              <Textarea
                id="purpose"
                placeholder="State the reason for this application (e.g. required for job application, visa, further studies)…"
                rows={3}
                {...register('purpose')}
              />
              {errors.purpose && <p className="text-xs text-destructive">{errors.purpose.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea id="notes" placeholder="Any additional information (optional)…" rows={2} {...register('notes')} />
            </div>
          </CardContent>
        </Card>

        {/* Fee calculation */}
        {activeConfig && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4" />Fee Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Fee</span>
                <span>{formatCurrency(activeConfig.baseFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per Semester ({watchedSemesters} × {formatCurrency(activeConfig.perSemesterFee)})</span>
                <span>{formatCurrency(watchedSemesters * Number(activeConfig.perSemesterFee))}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Total Fee</span>
                <span className="text-primary">{formatCurrency(calculatedFee ?? 0)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠ Demo values only — not official University of Karachi fees.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
