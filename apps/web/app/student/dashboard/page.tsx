'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Ticket, FileText, CheckCircle2, Clock, PlusCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface DashboardData {
  stats: {
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    pendingApplications: number;
    completedApplications: number;
  };
  recentTickets: { id: string; ticketNumber: string; department: { name: string }; issue: { name: string }; status: string; createdAt: string }[];
  recentApplications: { id: string; applicationNumber: string; applicationType: string; office: string; status: string; totalFee: string; createdAt: string }[];
}

export default function StudentDashboard() {
  const { user } = useAuth('STUDENT');
  const { data, isLoading } = useQuery<{ data: DashboardData }>({
    queryKey: ['student-dashboard'],
    queryFn: () => api.get('/students/dashboard'),
    enabled: !!user,
  });

  if (isLoading) return <LoadingState text="Loading dashboard…" />;
  const d = data?.data;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.student?.fullName?.split(' ')[0] ?? 'Student'}`}
        description={`${user?.student?.program} · Semester ${user?.student?.semester} · ${user?.student?.seatNumber}`}
        breadcrumb={[{ label: 'Dashboard' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Open Tickets" value={d?.stats.openTickets ?? 0} icon={AlertCircle} color="blue" />
        <StatCard title="In Progress" value={d?.stats.inProgressTickets ?? 0} icon={Clock} color="amber" />
        <StatCard title="Resolved" value={d?.stats.resolvedTickets ?? 0} icon={CheckCircle2} color="green" />
        <StatCard title="Pending Applications" value={d?.stats.pendingApplications ?? 0} icon={FileText} color="purple" />
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/student/tickets/new">
                <PlusCircle className="h-4 w-4" />
                Submit Complaint
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/applications/new?type=PROFORMA">
                <FileText className="h-4 w-4" />
                Apply for Proforma
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/applications/new?type=TRANSCRIPT">
                <FileText className="h-4 w-4" />
                Apply for Transcript
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Tickets</CardTitle>
              <Link href="/student/tickets" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {!d?.recentTickets.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No tickets yet.</p>
            ) : (
              <div className="space-y-3">
                {d.recentTickets.map(t => (
                  <Link key={t.id} href={`/student/tickets/${t.id}`}>
                    <div className="flex items-center justify-between py-2 hover:bg-accent/50 rounded px-2 -mx-2 transition-colors cursor-pointer">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.ticketNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.issue.name} · {t.department.name}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                        <StatusBadge status={t.status} type="ticket" />
                        <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(t.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Applications</CardTitle>
              <Link href="/student/applications" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {!d?.recentApplications.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {d.recentApplications.map(a => (
                  <Link key={a.id} href={`/student/applications/${a.id}`}>
                    <div className="flex items-center justify-between py-2 hover:bg-accent/50 rounded px-2 -mx-2 transition-colors cursor-pointer">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.applicationNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.applicationType} · {a.office.replace('_', "'s ").replace(/_/g, ' ')}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                        <StatusBadge status={a.status} type="application" />
                        <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(a.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
