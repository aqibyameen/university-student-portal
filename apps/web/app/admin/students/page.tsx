'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function AdminStudentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: any[]; pagination: any }>({
    queryKey: ['admin-students', search, page],
    queryFn: () => api.get(`/admin/students?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  });

  const students = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Students"
        description="View all registered students"
        breadcrumb={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Students' }]}
      />

      <div className="mb-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students…" className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <Card>
        {isLoading ? <TableSkeleton /> : students.length === 0 ? (
          <EmptyState icon={Users} title="No students found" />
        ) : (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Seat Number</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Program</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Semester</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tickets</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Apps</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((s: any) => (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="py-3 px-4 font-mono text-xs">{s.seatNumber}</td>
                      <td className="py-3 px-4 font-medium">{s.fullName}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{s.program}</td>
                      <td className="py-3 px-4 text-center">{s.semester}</td>
                      <td className="py-3 px-4 text-center">{s._count?.tickets ?? 0}</td>
                      <td className="py-3 px-4 text-center">{s._count?.applications ?? 0}</td>
                      <td className="py-3 px-4"><Badge variant={s.isActive ? 'success' : 'secondary'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    </tr>
                  ))}
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
