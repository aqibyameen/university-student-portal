'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  phone: z.string().max(20).optional(),
  email: z.string().email().max(254).optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export default function StudentProfilePage() {
  const { user } = useAuth('STUDENT');
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data } = useQuery<{ data: any }>({
    queryKey: ['student-profile'],
    queryFn: () => api.get('/students/me'),
  });

  const profile = data?.data;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: { phone: profile?.phone ?? '', email: profile?.email ?? '' },
  });

  const mutation = useMutation({
    mutationFn: (d: FormData) => api.patch('/students/me', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-profile'] });
      toast({ variant: 'success', title: 'Profile updated' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Update failed', description: err.message }),
  });

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="View and update your contact information"
        breadcrumb={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Profile' }]}
      />

      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Academic Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Full Name</p><p className="font-medium">{profile?.fullName}</p></div>
            <div><p className="text-xs text-muted-foreground">Seat Number</p><p className="font-medium font-mono">{profile?.seatNumber}</p></div>
            <div><p className="text-xs text-muted-foreground">Program</p><p className="font-medium">{profile?.program}</p></div>
            <div><p className="text-xs text-muted-foreground">Department</p><p className="font-medium">{profile?.department}</p></div>
            <div><p className="text-xs text-muted-foreground">Semester</p><p className="font-medium">Semester {profile?.semester}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="your@email.com" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="03xx-xxxxxxx" {...register('phone')} />
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
