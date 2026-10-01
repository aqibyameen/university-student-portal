'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';

export default function AdminAuditLogsPage() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: any[]; pagination: any }>({
    queryKey: ['audit-logs', action, page],
    queryFn: () => api.get(`/admin/audit-logs?page=${page}&pageSize=25${action ? `&action=${encodeURIComponent(action)}` : ''}`),
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  const ACTION_COLORS: Record<string, string> = {
    LOGIN: 'bg-blue-100 text-blue-700',
    LOGOUT: 'bg-slate-100 text-slate-700',
    TICKET_CREATED: 'bg-emerald-100 text-emerald-700',
    TICKET_STATUS_CHANGED: 'bg-amber-100 text-amber-700',
    APPLICATION_CREATED: 'bg-purple-100 text-purple-700',
    APPLICATION_STATUS_CHANGED: 'bg-amber-100 text-amber-700',
    RECEIPT_UPLOADED: 'bg-emerald-100 text-emerald-700',
    STAFF_CREATED: 'bg-blue-100 text-blue-700',
    FEE_UPDATED: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="System audit trail for all important actions"
        breadcrumb={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Audit Logs' }]}
      />

      <div className="mb-4">
        <Input placeholder="Filter by action (e.g. LOGIN, TICKET_CREATED)…" value={action} onChange={e => { setAction(e.target.value); setPage(1); }} className="max-w-xs" />
      </div>

      <Card>
        {isLoading ? <TableSkeleton /> : logs.length === 0 ? (
          <EmptyState icon={BookOpen} title="No audit logs found" />
        ) : (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Entity</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">IP</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log: any) => {
                    const name = log.user?.staffProfile?.fullName ?? log.user?.student?.fullName ?? log.user?.email ?? 'System';
                    const colorClass = ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-700';
                    return (
                      <tr key={log.id} className="hover:bg-muted/20">
                        <td className="py-3 px-4">
                          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${colorClass}`}>{log.action}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-xs">{name}</p>
                          <p className="text-xs text-muted-foreground">{log.user?.role}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{log.entityType}{log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ''}</td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{log.ipAddress ?? '—'}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
    </div>
  );
}
