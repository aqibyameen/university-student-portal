'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ExternalLink, User, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { APPLICATION_TRANSITIONS } from '@portal/types';
import type { ApplicationStatus } from '@portal/types';

const remarkSchema = z.object({ remark: z.string().min(1).max(1000) });
type RemarkForm = z.infer<typeof remarkSchema>;

const STATUS_LABELS: Record<string, string> = {
  APPLICATION_SUBMITTED: 'Submitted', WAITING_FOR_PAYMENT: 'Awaiting Payment',
  PAYMENT_RECEIVED: 'Payment Received', UNDER_PROCESS: 'Under Process',
  READY_FOR_COLLECTION: 'Ready for Collection', COMPLETED: 'Completed', REJECTED: 'Rejected',
};

const OFFICE_LABELS: Record<string, string> = {
  REGISTRAR_OFFICE: "Registrar's Office", SEMESTER_CELL: 'Semester Cell',
};

export default function StaffApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusRemark, setStatusRemark] = useState('');

  const { data, isLoading } = useQuery<{ data: any }>({
    queryKey: ['staff-application', id],
    queryFn: () => api.get(`/applications/${id}`),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RemarkForm>({ resolver: zodResolver(remarkSchema) });

  const addRemark = useMutation({
    mutationFn: (d: RemarkForm) => api.post(`/applications/${id}/remarks`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff-application', id] }); reset(); toast({ variant: 'success', title: 'Remark added' }); },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  const updateStatus = useMutation({
    mutationFn: (d: { status: string; remark?: string }) => api.patch(`/applications/${id}/status`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-application', id] });
      qc.invalidateQueries({ queryKey: ['staff-applications'] });
      qc.invalidateQueries({ queryKey: ['staff-dashboard'] });
      setSelectedStatus(''); setStatusRemark('');
      toast({ variant: 'success', title: 'Status updated' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  if (isLoading) return <LoadingState />;
  const app = data?.data;
  if (!app) return <p>Application not found.</p>;

  const allowedTransitions = APPLICATION_TRANSITIONS[app.status as ApplicationStatus] ?? [];

  return (
    <div>
      <PageHeader
        title={app.applicationNumber}
        description={`${app.applicationType} · ${OFFICE_LABELS[app.office]}`}
        breadcrumb={[
          { label: 'Dashboard', href: '/staff/dashboard' },
          { label: 'Applications', href: '/staff/applications' },
          { label: app.applicationNumber },
        ]}
        actions={<StatusBadge status={app.status} type="application" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Student */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Student Information</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Full Name</dt><dd className="font-medium">{app.student?.fullName}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Seat Number</dt><dd className="font-mono">{app.student?.seatNumber}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Program</dt><dd>{app.student?.program}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Semester</dt><dd>Semester {app.student?.semester}</dd></div>
                {app.student?.email && <div><dt className="text-xs text-muted-foreground">Email</dt><dd>{app.student.email}</dd></div>}
              </dl>
            </CardContent>
          </Card>

          {/* Application details */}
          <Card>
            <CardHeader><CardTitle className="text-base">Application Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Type</dt><dd className="font-medium">{app.applicationType}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Office</dt><dd>{OFFICE_LABELS[app.office]}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Semesters</dt><dd>{app.numberOfSemesters}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Total Fee</dt><dd className="font-semibold">{formatCurrency(app.totalFee)}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Purpose</dt><dd>{app.purpose}</dd></div>
              </dl>
            </CardContent>
          </Card>

          {/* Receipt */}
          <Card>
            <CardHeader><CardTitle className="text-base">Payment Receipt</CardTitle></CardHeader>
            <CardContent>
              {app.receipt ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded p-3 border border-emerald-200">
                    <span className="text-sm font-medium">✓ Receipt uploaded</span>
                    <span className="text-xs text-emerald-600 ml-1">{formatDateTime(app.receipt.createdAt)}</span>
                  </div>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${id}/receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Receipt
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No receipt uploaded yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Update status */}
          {allowedTransitions.length > 0 && (
            <Card className="border-primary/20">
              <CardHeader><CardTitle className="text-base">Update Status</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>New Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger><SelectValue placeholder="Select new status…" /></SelectTrigger>
                    <SelectContent>
                      {allowedTransitions.map(s => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Remark (optional)</Label>
                  <Textarea placeholder="Add a remark…" rows={2} value={statusRemark} onChange={e => setStatusRemark(e.target.value)} />
                </div>
                <Button
                  onClick={() => selectedStatus && updateStatus.mutate({ status: selectedStatus, remark: statusRemark || undefined })}
                  disabled={!selectedStatus || updateStatus.isPending}
                >
                  {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update Status
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Remarks */}
          <Card>
            <CardHeader><CardTitle className="text-base">Remarks</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {app.remarks.map((r: any) => (
                <div key={r.id} className="bg-muted/40 rounded-lg p-3 border-l-2 border-primary/20">
                  <p className="text-sm">{r.remark}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.user?.staffProfile?.fullName ?? 'Staff'} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
              ))}
              <form onSubmit={handleSubmit(d => addRemark.mutate(d))} className="pt-3 space-y-2 border-t">
                <Textarea placeholder="Add a remark for the student…" rows={3} {...register('remark')} />
                {errors.remark && <p className="text-xs text-destructive">{errors.remark.message}</p>}
                <Button type="submit" size="sm" disabled={addRemark.isPending}>
                  {addRemark.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Add Remark
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Status History</CardTitle></CardHeader>
            <CardContent><Timeline entries={app.statusHistory} type="application" /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
