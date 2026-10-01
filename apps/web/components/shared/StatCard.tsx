import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate';
  subtitle?: string;
}

const colorMap = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
  green:  { bg: 'bg-emerald-50',icon: 'text-emerald-600',border: 'border-emerald-100' },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  border: 'border-amber-100' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
  slate:  { bg: 'bg-slate-50',  icon: 'text-slate-600',  border: 'border-slate-100' },
};

export function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }: StatCardProps) {
  const c = colorMap[color];
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn('flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center ml-4', c.bg, 'border', c.border)}>
            <Icon className={cn('h-6 w-6', c.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
