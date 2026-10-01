'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, Ticket } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface TicketItem {
  id: string; ticketNumber: string;
  student: { seatNumber: string; fullName: string; program: string };
  issue: { name: string };
  status: string; priority: string;
  createdAt: string; updatedAt: string;
  _count: { attachments: number; remarks: number };
}

export default function StaffTicketsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: TicketItem[]; pagination: { total: number; totalPages: number } }>({
    queryKey: ['staff-tickets', search, status, page],
    queryFn: () => api.get(`/tickets?pageSize=15&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}${status ? `&status=${status}` : ''}&sortDirection=desc`),
  });

  const tickets = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Department Tickets"
        description="Manage and process tickets assigned to your department"
        breadcrumb={[{ label: 'Dashboard', href: '/staff/dashboard' }, { label: 'Tickets' }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets…" className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_FOR_STUDENT">Waiting for Student</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <Card>
        {isLoading ? <TableSkeleton /> : tickets.length === 0 ? (
          <EmptyState icon={Ticket} title="No tickets found" description="No tickets in your department match the current filters." />
        ) : (
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ticket #</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Issue</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tickets.map(t => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs">{t.ticketNumber}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{t.student.fullName}</p>
                        <p className="text-xs text-muted-foreground">{t.student.seatNumber}</p>
                      </td>
                      <td className="py-3 px-4 max-w-[180px] truncate">{t.issue.name}</td>
                      <td className="py-3 px-4"><StatusBadge status={t.status} type="ticket" /></td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(t.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild size="sm" variant="ghost"><Link href={`/staff/tickets/${t.id}`}>Process</Link></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y">
              {tickets.map(t => (
                <Link key={t.id} href={`/staff/tickets/${t.id}`}>
                  <div className="p-4 hover:bg-muted/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs">{t.ticketNumber}</span>
                      <StatusBadge status={t.status} type="ticket" />
                    </div>
                    <p className="text-sm font-medium">{t.student.fullName}</p>
                    <p className="text-xs text-muted-foreground">{t.issue.name} · {formatDate(t.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
            {pagination && pagination.totalPages > 1 && (
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
    </div>
  );
}
