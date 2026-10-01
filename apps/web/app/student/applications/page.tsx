'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Search, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils';

interface AppItem {
  id: string; applicationNumber: string;
  applicationType: string; office: string;
  numberOfSemesters: number; totalFee: string;
  status: string; createdAt: string;
  receipt?: { id: string } | null;
}

const OFFICE_LABELS: Record<string, string> = {
  REGISTRAR_OFFICE: "Registrar's Office",
  SEMESTER_CELL: 'Semester Cell',
};

export default function StudentApplicationsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: AppItem[]; pagination: { total: number; totalPages: number } }>({
    queryKey: ['student-applications', search, status, page],
    queryFn: () => api.get(`/applications?pageSize=15&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}${status ? `&status=${status}` : ''}`),
  });

  const apps = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Manage your Proforma and Transcript applications"
        breadcrumb={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Applications' }]}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/student/applications/new?type=PROFORMA"><PlusCircle className="h-4 w-4" />Proforma</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/student/applications/new?type=TRANSCRIPT"><PlusCircle className="h-4 w-4" />Transcript</Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications…"
            className="pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="APPLICATION_SUBMITTED">Submitted</option>
          <option value="WAITING_FOR_PAYMENT">Awaiting Payment</option>
          <option value="PAYMENT_RECEIVED">Payment Received</option>
          <option value="UNDER_PROCESS">Under Process</option>
          <option value="READY_FOR_COLLECTION">Ready for Collection</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <Card>
        {isLoading ? <TableSkeleton /> : apps.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No applications found"
            description="Apply for a Proforma or Transcript to get started."
            action={
              <div className="flex gap-2">
                <Button asChild variant="outline"><Link href="/student/applications/new?type=PROFORMA">Apply for Proforma</Link></Button>
                <Button asChild><Link href="/student/applications/new?type=TRANSCRIPT">Apply for Transcript</Link></Button>
              </div>
            }
          />
        ) : (
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Application #</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Office</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fee</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {apps.map(a => (
                    <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs">{a.applicationNumber}</td>
                      <td className="py-3 px-4">{a.applicationType}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{OFFICE_LABELS[a.office] ?? a.office}</td>
                      <td className="py-3 px-4"><StatusBadge status={a.status} type="application" /></td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(a.totalFee)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(a.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/student/applications/${a.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y">
              {apps.map(a => (
                <Link key={a.id} href={`/student/applications/${a.id}`}>
                  <div className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-medium">{a.applicationNumber}</span>
                      <StatusBadge status={a.status} type="application" />
                    </div>
                    <p className="text-sm font-medium">{a.applicationType} · {OFFICE_LABELS[a.office]}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(a.totalFee)} · {formatDate(a.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
            {pagination && pagination.totalPages > 1 && (
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
    </div>
  );
}
