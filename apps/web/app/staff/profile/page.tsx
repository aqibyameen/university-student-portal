'use client';
import { useAuth } from '@/hooks/use-auth';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StaffProfilePage() {
  const { user } = useAuth('STAFF');
  const profile = user?.staffProfile;

  return (
    <div>
      <PageHeader title="My Profile" breadcrumb={[{ label: 'Dashboard', href: '/staff/dashboard' }, { label: 'Profile' }]} />
      <div className="max-w-md">
        <Card>
          <CardHeader><CardTitle className="text-base">Staff Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Full Name</p><p className="font-medium">{profile?.fullName}</p></div>
            <div><p className="text-xs text-muted-foreground">Employee ID</p><p className="font-mono">{profile?.employeeId}</p></div>
            <div><p className="text-xs text-muted-foreground">Department</p><p className="font-medium">{profile?.department?.name}</p></div>
            <div><p className="text-xs text-muted-foreground">Email</p><p>{user?.email}</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
