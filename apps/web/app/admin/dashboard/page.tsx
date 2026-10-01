'use client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Building2, Ticket, FileText, CheckCircle2, Clock, AlertCircle, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/shared/StatCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3b82f6', IN_PROGRESS: '#f59e0b', WAITING_FOR_STUDENT: '#8b5cf6',
  RESOLVED: '#10b981', CLOSED: '#6b7280', REJECTED: '#ef4444',
};

const TYPE_COLORS = ['#1e3a8a', '#3b82f6'];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<{ data: any }>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard'),
  });

  if (isLoading) return <LoadingState />;
  const d = data?.data;
  const stats = d?.stats;
  const charts = d?.charts;

  return (
    <div>
      <PageHeader title="Admin Dashboard" description="System-wide statistics and analytics" breadcrumb={[{ label: 'Dashboard' }]} />

      {/* Stats row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Students" value={stats?.totalStudents ?? 0} icon={Users} color="blue" />
        <StatCard title="Total Staff" value={stats?.totalStaff ?? 0} icon={Shield} color="slate" />
        <StatCard title="Departments" value={stats?.totalDepartments ?? 0} icon={Building2} color="purple" />
        <StatCard title="Open Tickets" value={stats?.openTickets ?? 0} icon={AlertCircle} color="amber" />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="In Progress" value={stats?.inProgressTickets ?? 0} icon={Clock} color="amber" />
        <StatCard title="Resolved" value={stats?.resolvedTickets ?? 0} icon={CheckCircle2} color="green" />
        <StatCard title="Pending Apps" value={stats?.pendingApplications ?? 0} icon={FileText} color="blue" />
        <StatCard title="Completed Apps" value={stats?.completedApplications ?? 0} icon={CheckCircle2} color="green" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly tickets */}
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Ticket Volume</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts?.monthlyTickets ?? []} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e3a8a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tickets by department */}
        <Card>
          <CardHeader><CardTitle className="text-base">Tickets by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={(charts?.ticketsByDepartment ?? []).slice(0, 8)}
                layout="vertical"
                margin={{ top: 4, right: 20, bottom: 4, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Tickets by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={charts?.ticketsByStatus ?? []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, percent }) => `${status?.replace('_', ' ')} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(charts?.ticketsByStatus ?? []).map((entry: any, index: number) => (
                    <Cell key={index} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Applications by type */}
        <Card>
          <CardHeader><CardTitle className="text-base">Applications by Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={charts?.appsByType ?? []} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80}>
                  {(charts?.appsByType ?? []).map((_: any, index: number) => (
                    <Cell key={index} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
