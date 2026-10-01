'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export default function StaffDashboard() {
  const { user } = useAuth('STAFF');
  const { data, isLoading } = useQuery<{ data: any }>({
    queryKey: ['staff-dashboard'],
    queryFn: () => api.get('/staff/dashboard'),
    enabled: !!user,
  });

  if (isLoading) return <LoadingState />;
  const d = data?.data;

  return (
    <div>
      <PageHeader
        title={d?.department?.name ?? 'Staff Dashboard'}
        description={`${user?.staffProfile?.fullName} · ${user?.staffProfile?.employeeId}`}
        breadcrumb={[{ label: 'Dashboard' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Open Tickets" value={d?.stats.openTickets ?? 0} icon={AlertCircle} color="blue" />
        <StatCard title="In Progress" value={d?.stats.inProgressTickets ?? 0} icon={Clock} color="amber" />
        <StatCard title="Waiting" value={d?.stats.waitingTickets ?? 0} icon={Ticket} color="purple" />
        <StatCard title="Resolved" value={d?.stats.resolvedTickets ?? 0} icon={CheckCircle2} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Tickets</CardTitle>
              <Link href="/staff/tickets" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {!d?.recentTickets?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No tickets yet.</p>
            ) : (
              <div className="space-y-2">
                {d.recentTickets.map((t: any) => (
                  <Link key={t.id} href={`/staff/tickets/${t.id}`}>
                    <div className="flex items-center justify-between py-2 hover:bg-accent/50 rounded px-2 -mx-2 cursor-pointer">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.ticketNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.student?.fullName} · {t.issue?.name}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <StatusBadge status={t.status} type="ticket" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {d?.stats.pendingApplications > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Applications</CardTitle>
                <Link href="/staff/applications" className="text-xs text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {!d?.recentApplications?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No applications yet.</p>
              ) : (
                <div className="space-y-2">
                  {d.recentApplications.map((a: any) => (
                    <Link key={a.id} href={`/staff/applications/${a.id}`}>
                      <div className="flex items-center justify-between py-2 hover:bg-accent/50 rounded px-2 -mx-2 cursor-pointer">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{a.applicationNumber}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.student?.fullName} · {a.applicationType}</p>
                        </div>
                        <StatusBadge status={a.status} type="application" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
