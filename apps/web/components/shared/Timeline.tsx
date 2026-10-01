import { formatDateTime } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { CheckCircle2, Circle } from 'lucide-react';

interface TimelineEntry {
  id: string;
  oldStatus?: string | null;
  newStatus: string;
  remark?: string | null;
  changedBy: string;
  createdAt: string;
  user?: {
    role: string;
    staffProfile?: { fullName: string } | null;
    student?: { fullName: string } | null;
  };
}

function getUserName(entry: TimelineEntry) {
  if (entry.user?.staffProfile) return entry.user.staffProfile.fullName;
  if (entry.user?.student) return entry.user.student.fullName;
  return 'System';
}

interface TimelineProps {
  entries: TimelineEntry[];
  type?: 'ticket' | 'application';
}

export function Timeline({ entries, type = 'ticket' }: TimelineProps) {
  return (
    <div className="relative space-y-0">
      {entries.map((entry, idx) => (
        <div key={entry.id} className="flex gap-3">
          {/* Line + dot */}
          <div className="flex flex-col items-center">
            <div className="flex-shrink-0 mt-1">
              {idx === entries.length - 1 ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            {idx < entries.length - 1 && (
              <div className="w-px flex-1 bg-border my-1" />
            )}
          </div>
          {/* Content */}
          <div className="pb-5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={entry.newStatus} type={type} />
              <span className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              By {getUserName(entry)}
              {entry.user?.role && <span className="ml-1 text-muted-foreground/60">({entry.user.role.toLowerCase()})</span>}
            </p>
            {entry.remark && (
              <p className="mt-1.5 text-sm text-foreground bg-muted/50 rounded px-3 py-2 border-l-2 border-primary/30">
                {entry.remark}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
