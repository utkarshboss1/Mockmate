import { Badge } from '@/components/ui/badge';
import { BookingStatus } from '@interviewiq/shared';

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          Confirmed
        </Badge>
      );
    case BookingStatus.PENDING:
      return (
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
          Pending Payment
        </Badge>
      );
    case BookingStatus.COMPLETED:
      return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
          Completed
        </Badge>
      );
    case BookingStatus.CANCELLED_BY_CANDIDATE:
    case BookingStatus.CANCELLED_BY_INTERVIEWER:
      return (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive">
          Cancelled
        </Badge>
      );
    case BookingStatus.NO_SHOW:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          No Show
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
