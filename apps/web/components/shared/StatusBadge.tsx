import { Badge } from '@/components/ui/badge';

const TICKET_STATUS_MAP: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'destructive' | 'secondary' | 'purple' }> = {
  OPEN:                { label: 'Open',               variant: 'info'       },
  IN_PROGRESS:         { label: 'In Progress',        variant: 'warning'    },
  WAITING_FOR_STUDENT: { label: 'Waiting for You',    variant: 'purple'     },
  RESOLVED:            { label: 'Resolved',           variant: 'success'    },
  CLOSED:              { label: 'Closed',             variant: 'secondary'  },
  REJECTED:            { label: 'Rejected',           variant: 'destructive'},
};

const APP_STATUS_MAP: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'destructive' | 'secondary' | 'purple' }> = {
  APPLICATION_SUBMITTED:  { label: 'Submitted',            variant: 'info'       },
  WAITING_FOR_PAYMENT:    { label: 'Awaiting Payment',     variant: 'warning'    },
  PAYMENT_RECEIVED:       { label: 'Payment Received',     variant: 'purple'     },
  UNDER_PROCESS:          { label: 'Under Process',        variant: 'info'       },
  READY_FOR_COLLECTION:   { label: 'Ready for Collection', variant: 'success'    },
  COMPLETED:              { label: 'Completed',            variant: 'success'    },
  REJECTED:               { label: 'Rejected',             variant: 'destructive'},
};

interface StatusBadgeProps {
  status: string;
  type?: 'ticket' | 'application';
}

export function StatusBadge({ status, type = 'ticket' }: StatusBadgeProps) {
  const map = type === 'application' ? APP_STATUS_MAP : TICKET_STATUS_MAP;
  const config = map[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
