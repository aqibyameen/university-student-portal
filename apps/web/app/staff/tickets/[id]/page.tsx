'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2, ExternalLink, User } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDateTime, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TICKET_TRANSITIONS } from '@portal/types';
import type { TicketStatus } from '@portal/types';

const remarkSchema = z.object({ remark: z.string().min(1).max(1000) });
const statusSchema = z.object({
  status: z.string().min(1),
  remark: z.string().max(1000).optional(),
});

type RemarkForm = z.infer<typeof remarkSchema>;
type StatusForm = z.infer<typeof statusSchema>;

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In Progress', WAITING_FOR_STUDENT: 'Waiting for Student',
  RESOLVED: 'Resolved', CLOSED: 'Closed', REJECTED: 'Rejected',
};

export default function StaffTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusRemark, setStatusRemark] = useState('');

  const { data, isLoading } = useQuery<{ data: any }>({
    queryKey: ['staff-ticket', id],
    queryFn: () => api.get(`/tickets/${id}`),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RemarkForm>({ resolver: zodResolver(remarkSchema) });

  const addRemark = useMutation({
    mutationFn: (d: RemarkForm) => api.post(`/tickets/${id}/remarks`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff-ticket', id] }); reset(); toast({ variant: 'success', title: 'Remark added' }); },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  const [selectedStatus, setSelectedStatus] = useState('');
  const updateStatus = useMutation({
    mutationFn: (d: { status: string; remark?: string }) => api.patch(`/tickets/${id}/status`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-ticket', id] });
      qc.invalidateQueries({ queryKey: ['staff-tickets'] });
      qc.invalidateQueries({ queryKey: ['staff-dashboard'] });
      setSelectedStatus(''); setStatusRemark('');
      toast({ variant: 'success', title: 'Status updated' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  if (isLoading) return <LoadingState />;
  const ticket = data?.data;
  if (!ticket) return <p>Ticket not found.</p>;

  const allowedTransitions = TICKET_TRANSITIONS[ticket.status as TicketStatus] ?? [];

  return (
    <div>
      <PageHeader
        title={ticket.ticketNumber}
        description={`${ticket.issue.name} — ${ticket.department.name}`}
        breadcrumb={[
          { label: 'Dashboard', href: '/staff/dashboard' },
          { label: 'Tickets', href: '/staff/tickets' },
          { label: ticket.ticketNumber },
        ]}
        actions={<StatusBadge status={ticket.status} type="ticket" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Student info */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Student Information</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Full Name</dt><dd className="font-medium">{ticket.student.fullName}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Seat Number</dt><dd className="font-mono">{ticket.student.seatNumber}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Program</dt><dd>{ticket.student.program}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Semester</dt><dd>Semester {ticket.student.semester}</dd></div>
                {ticket.student.email && <div><dt className="text-xs text-muted-foreground">Email</dt><dd>{ticket.student.email}</dd></div>}
                {ticket.student.phone && <div><dt className="text-xs text-muted-foreground">Phone</dt><dd>{ticket.student.phone}</dd></div>}
              </dl>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-base">Complaint Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground border-t pt-3">
                <span>Submitted: {formatDateTime(ticket.createdAt)}</span>
                <span className={`font-semibold ${ticket.priority === 'URGENT' ? 'text-red-600' : ticket.priority === 'HIGH' ? 'text-amber-600' : ''}`}>
                  Priority: {ticket.priority}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Attachments</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {ticket.attachments.map((att: any) => (
                  <a
                    key={att.id}
                    href={`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/attachments/${att.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {att.originalFilename}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

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
                  <Textarea
                    placeholder="Add a remark explaining the status change…"
                    rows={2}
                    value={statusRemark}
                    onChange={e => setStatusRemark(e.target.value)}
                  />
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
            <CardHeader><CardTitle className="text-base">Remarks ({ticket.remarks.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ticket.remarks.map((r: any) => (
                <div key={r.id} className="bg-muted/40 rounded-lg p-3 border-l-2 border-primary/20">
                  <p className="text-sm">{r.remark}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.user?.staffProfile?.fullName ?? r.user?.student?.fullName ?? 'System'} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
              ))}
              <form onSubmit={handleSubmit(d => addRemark.mutate(d))} className="pt-3 space-y-2 border-t">
                <Label>Add Remark</Label>
                <Textarea placeholder="Write a remark or update for the student…" rows={3} {...register('remark')} />
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
            <CardHeader><CardTitle className="text-base">Status History</CardTitle></CardHeader>
            <CardContent><Timeline entries={ticket.statusHistory} type="ticket" /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
