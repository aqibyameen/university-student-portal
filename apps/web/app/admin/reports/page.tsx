'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Ticket, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type ReportType = 'tickets' | 'applications';

export default function AdminReportsPage() {
  const [type, setType] = useState<ReportType>('tickets');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloading, setDownloading] = useState(false);

  function buildQuery() {
    const p = new URLSearchParams();
    if (dateFrom) p.set('dateFrom', new Date(dateFrom).toISOString());
    if (dateTo) p.set('dateTo', new Date(dateTo + 'T23:59:59').toISOString());
    return p.toString();
  }

  const { data, isLoading } = useQuery<{ data: any }>({
    queryKey: ['admin-report', type, dateFrom, dateTo],
    queryFn: () => api.get(`/admin/reports/${type}?${buildQuery()}`),
  });

  async function downloadCsv() {
    setDownloading(true);
    try {
      const blob = await api.get<Blob>(`/admin/reports/${type}?${buildQuery()}&format=csv`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${type}-report.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setDownloading(false);
  }

  const summary = data?.data?.summary;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and export system reports"
        breadcrumb={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Reports' }]}
        actions={<Button variant="outline" onClick={downloadCsv} disabled={downloading}><Download className="h-4 w-4" />Export CSV</Button>}
      />

      <div className="flex rounded-lg bg-muted p-1 w-fit mb-6">
        {(['tickets', 'applications'] as ReportType[]).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${type === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="df">Date From</Label>
            <input id="df" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dt">Date To</Label>
            <input id="dt" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <Button variant="outline" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear</Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
      ) : (
        <>
          {type === 'tickets' && summary && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Tickets" value={summary.total ?? 0} icon={Ticket} color="blue" />
                {summary.byStatus?.map((s: any) => (
                  <StatCard key={s.status} title={s.status.replace(/_/g, ' ')} value={s.count} icon={AlertCircle} color="slate" />
                ))}
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">By Department</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left py-2 font-medium text-muted-foreground">Department</th><th className="text-right py-2 font-medium text-muted-foreground">Tickets</th></tr></thead>
                    <tbody className="divide-y">
                      {summary.byDepartment?.map((d: any) => (
                        <tr key={d.department} className="hover:bg-muted/20"><td className="py-2">{d.department}</td><td className="py-2 text-right font-semibold">{d.count}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
          {type === 'applications' && summary && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Applications" value={summary.total ?? 0} icon={FileText} color="blue" />
                {summary.byType?.map((t: any) => (
                  <StatCard key={t.type} title={t.type} value={t.count} icon={FileText} color="slate" />
                ))}
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">By Status</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left py-2 font-medium text-muted-foreground">Status</th><th className="text-right py-2 font-medium text-muted-foreground">Count</th></tr></thead>
                    <tbody className="divide-y">
                      {summary.byStatus?.map((s: any) => (
                        <tr key={s.status} className="hover:bg-muted/20"><td className="py-2">{s.status.replace(/_/g, ' ')}</td><td className="py-2 text-right font-semibold">{s.count}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
