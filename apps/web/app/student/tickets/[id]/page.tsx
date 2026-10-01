'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Paperclip, MessageSquare, Clock, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const remarkSchema = z.object({ remark: z.string().min(1, 'Remark cannot be empty').max(1000) });
type RemarkForm = z.infer<typeof remarkSchema>;

export default function StudentTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RemarkForm>({
    resolver: zodResolver(remarkSchema),
  });

  const { data, isLoading } = useQuery<{ data: any }>({
    queryKey: ['ticket', id],
    queryFn: () => api.get(`/tickets/${id}`),
  });

  const addRemark = useMutation({
    mutationFn: (d: RemarkForm) => api.post(`/tickets/${id}/remarks`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      reset();
      toast({ variant: 'success', title: 'Remark added' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  if (isLoading) return <LoadingState />;
  const ticket = data?.data;
  if (!ticket) return <p className="text-muted-foreground">Ticket not found.</p>;

  const PRIORITY_COLOR: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-amber-100 text-amber-700',
    URGENT: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <PageHeader
        title={ticket.ticketNumber}
        description={`${ticket.issue.name} — ${ticket.department.name}`}
        breadcrumb={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Tickets', href: '/student/tickets' },
          { label: ticket.ticketNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.status} type="ticket" />
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[ticket.priority] ?? ''}`}>
              {ticket.priority}
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
                <span>Created: {formatDateTime(ticket.createdAt)}</span>
                <span>Updated: {formatDateTime(ticket.updatedAt)}</span>
                {ticket.resolvedAt && <span>Resolved: {formatDateTime(ticket.resolvedAt)}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Attachment */}
          {ticket.attachments.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Paperclip className="h-4 w-4" />Attachment</CardTitle></CardHeader>
              <CardContent>
                {ticket.attachments.map((att: any) => (
                  <div key={att.id}>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/attachments/${att.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {att.originalFilename}
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Remarks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Remarks ({ticket.remarks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.remarks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No remarks yet.</p>
              ) : (
                ticket.remarks.map((r: any) => (
                  <div key={r.id} className="bg-muted/40 rounded-lg p-3 border-l-2 border-primary/20">
                    <p className="text-sm">{r.remark}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.user?.staffProfile?.fullName ?? r.user?.student?.fullName ?? 'System'} · {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                ))
              )}
              {/* Add remark */}
              <form onSubmit={handleSubmit(d => addRemark.mutate(d))} className="pt-2 space-y-2 border-t mt-4">
                <Label htmlFor="remark-input">Add a comment</Label>
                <Textarea id="remark-input" placeholder="Write a comment or question…" rows={3} {...register('remark')} />
                {errors.remark && <p className="text-xs text-destructive">{errors.remark.message}</p>}
                <Button type="submit" size="sm" disabled={addRemark.isPending}>
                  {addRemark.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Add Comment
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Ticket Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-medium">{ticket.department.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Issue</p>
                <p className="font-medium">{ticket.issue.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={ticket.status} type="ticket" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Priority</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${PRIORITY_COLOR[ticket.priority] ?? ''}`}>
                  {ticket.priority}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Status History</CardTitle></CardHeader>
            <CardContent>
              <Timeline entries={ticket.statusHistory} type="ticket" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
