'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Download, Upload, Clock, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const OFFICE_LABELS: Record<string, string> = {
  REGISTRAR_OFFICE: "Registrar's Office",
  SEMESTER_CELL: 'Semester Cell',
};

export default function StudentApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery<{ data: any }>({
    queryKey: ['application', id],
    queryFn: () => api.get(`/applications/${id}`),
  });

  async function downloadVoucher() {
    try {
      const blob = await api.get<Blob>(`/applications/${id}/voucher`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voucher-${app?.applicationNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Download failed', description: err.message });
    }
  }

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Upload JPG, PNG, WebP, or PDF only.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum 5MB.' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('receipt', file);
      await api.postForm(`/applications/${id}/receipt`, fd);
      qc.invalidateQueries({ queryKey: ['application', id] });
      qc.invalidateQueries({ queryKey: ['student-dashboard'] });
      toast({ variant: 'success', title: 'Receipt uploaded', description: 'Your payment receipt has been submitted.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally { setUploading(false); }
  }

  if (isLoading) return <LoadingState />;
  const app = data?.data;
  if (!app) return <p className="text-muted-foreground">Application not found.</p>;

  const canUploadReceipt = app.status === 'WAITING_FOR_PAYMENT' && !app.receipt;

  return (
    <div>
      <PageHeader
        title={app.applicationNumber}
        description={`${app.applicationType} · ${OFFICE_LABELS[app.office] ?? app.office}`}
        breadcrumb={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Applications', href: '/student/applications' },
          { label: app.applicationNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={app.status} type="application" />
            <Button variant="outline" size="sm" onClick={downloadVoucher}>
              <Download className="h-4 w-4" />
              Download Voucher
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Application details */}
          <Card>
            <CardHeader><CardTitle className="text-base">Application Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Application Type</dt><dd className="font-medium">{app.applicationType}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Office</dt><dd className="font-medium">{OFFICE_LABELS[app.office]}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Semesters</dt><dd className="font-medium">{app.numberOfSemesters}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Submitted</dt><dd className="font-medium">{formatDate(app.createdAt)}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Purpose</dt><dd className="font-medium">{app.purpose}</dd></div>
                {app.notes && <div className="col-span-2"><dt className="text-xs text-muted-foreground">Notes</dt><dd>{app.notes}</dd></div>}
              </dl>
            </CardContent>
          </Card>

          {/* Fee breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-base">Fee Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Base Fee</span><span>{formatCurrency(app.baseFee)}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per Semester ({app.numberOfSemesters} × {formatCurrency(app.perSemesterFee)})</span>
                <span>{formatCurrency(app.numberOfSemesters * Number(app.perSemesterFee))}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(app.totalFee)}</span>
              </div>
              <p className="text-xs text-muted-foreground">⚠ Demo values — not official UoK fees.</p>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className={canUploadReceipt ? 'border-amber-200 bg-amber-50/30' : ''}>
            <CardHeader>
              <CardTitle className="text-base">Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {app.receipt ? (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded p-3 border border-emerald-200">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Receipt uploaded</p>
                    <p className="text-xs text-emerald-600">{formatDateTime(app.receipt.createdAt)}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Pay <strong>{formatCurrency(app.totalFee)}</strong> at any authorized bank branch, then upload your paid receipt.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={downloadVoucher}>
                      <Download className="h-4 w-4" />
                      Download Voucher
                    </Button>
                    {canUploadReceipt && (
                      <>
                        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          Upload Receipt
                        </Button>
                        <input ref={fileRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleReceiptUpload} />
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Remarks */}
          {app.remarks.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Staff Remarks</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {app.remarks.map((r: any) => (
                  <div key={r.id} className="bg-muted/40 rounded-lg p-3 border-l-2 border-primary/20">
                    <p className="text-sm">{r.remark}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.user?.staffProfile?.fullName ?? 'Staff'} · {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Current Status</CardTitle></CardHeader>
            <CardContent>
              <StatusBadge status={app.status} type="application" />
              {app.completedAt && (
                <p className="text-xs text-muted-foreground mt-2">Completed: {formatDate(app.completedAt)}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline entries={app.statusHistory} type="application" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
