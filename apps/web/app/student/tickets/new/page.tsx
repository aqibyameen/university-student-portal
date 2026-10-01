'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  departmentId: z.string().min(1, 'Select a department'),
  issueId: z.string().min(1, 'Select an issue'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});
type FormData = z.infer<typeof schema>;

interface Department { id: string; name: string; code: string }
interface Issue { id: string; name: string }

export default function NewTicketPage() {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [attachment, setAttachment] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const { data: deptData } = useQuery<{ data: Department[] }>({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments?isActive=true&pageSize=50'),
  });

  const { data: issueData } = useQuery<{ data: Issue[] }>({
    queryKey: ['issues', selectedDeptId],
    queryFn: () => api.get(`/departments/${selectedDeptId}/issues`),
    enabled: !!selectedDeptId,
  });

  const departments = deptData?.data ?? [];
  const issues = issueData?.data ?? [];

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const fd = new FormData();
      fd.append('departmentId', data.departmentId);
      fd.append('issueId', data.issueId);
      fd.append('description', data.description);
      fd.append('priority', data.priority);
      if (attachment) fd.append('attachment', attachment);
      return api.postForm('/tickets', fd);
    },
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['student-tickets'] });
      qc.invalidateQueries({ queryKey: ['student-dashboard'] });
      toast({ variant: 'success', title: 'Ticket created', description: `Ticket ${res.data.ticketNumber} submitted successfully.` });
      router.push(`/student/tickets/${res.data.id}`);
    },
    onError: (err: Error) => {
      toast({ variant: 'destructive', title: 'Submission failed', description: err.message });
    },
  });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Only JPG, PNG, and WebP images are allowed.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum file size is 5MB.' });
      return;
    }
    setAttachment(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleDeptChange(deptId: string) {
    setSelectedDeptId(deptId);
    setValue('departmentId', deptId);
    setValue('issueId', '');
  }

  return (
    <div>
      <PageHeader
        title="Submit a Complaint"
        description="Describe your issue and we'll route it to the right department."
        breadcrumb={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Tickets', href: '/student/tickets' },
          { label: 'New' },
        ]}
      />

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Department & Issue</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dept">Department *</Label>
              <Select onValueChange={handleDeptChange}>
                <SelectTrigger id="dept">
                  <SelectValue placeholder="Select department…" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issue">Issue *</Label>
              <Select onValueChange={v => setValue('issueId', v)} disabled={!selectedDeptId}>
                <SelectTrigger id="issue">
                  <SelectValue placeholder={selectedDeptId ? 'Select issue…' : 'Select a department first'} />
                </SelectTrigger>
                <SelectContent>
                  {issues.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.issueId && <p className="text-xs text-destructive">{errors.issueId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select defaultValue="MEDIUM" onValueChange={v => setValue('priority', v as FormData['priority'])}>
                <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="desc">Describe your issue *</Label>
              <Textarea
                id="desc"
                placeholder="Provide a clear description of the problem. Include relevant details such as location, date, and any previous attempts to resolve it…"
                rows={5}
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              <p className="text-xs text-muted-foreground">Minimum 10 characters. Be as specific as possible.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Attachment (optional)</CardTitle></CardHeader>
          <CardContent>
            {!preview ? (
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload a photo</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP · Max 5MB</p>
                </div>
                <Input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
              </label>
            ) : (
              <div className="relative">
                <img src={preview} alt="Attachment preview" className="rounded-lg max-h-48 w-auto border" />
                <button
                  type="button"
                  onClick={() => { setAttachment(null); setPreview(null); }}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  aria-label="Remove attachment"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> {attachment?.name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Ticket
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
