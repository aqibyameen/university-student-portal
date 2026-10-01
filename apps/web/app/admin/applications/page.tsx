'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function AdminApplicationsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: any[]; pagination: any }>({
    queryKey: ['admin-applications', search, status, page],
    queryFn: () => api.get(`/applications?pageSize=20&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}${status ? `&status=${status}` : ''}`),
  });

  const apps = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="All Applications"
        description="System-wide document application management"
        breadcrumb={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Applications' }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search applications…" className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All statuses</option>
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
          <EmptyState icon={FileText} title="No applications found" />
        ) : (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">App #</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Office</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fee</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {apps.map((a: any) => (
                    <tr key={a.id} className="hover:bg-muted/20">
                      <td className="py-3 px-4 font-mono text-xs">{a.applicationNumber}</td>
                      <td className="py-3 px-4"><p className="font-medium">{a.student?.fullName}</p><p className="text-xs text-muted-foreground">{a.student?.seatNumber}</p></td>
                      <td className="py-3 px-4">{a.applicationType}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{a.office?.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4"><StatusBadge status={a.status} type="application" /></td>
                      <td className="py-3 px-4">{formatCurrency(a.totalFee)}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{formatDate(a.createdAt)}</td>
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
    </div>
  );
}
