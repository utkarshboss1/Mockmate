'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookingStatusBadge } from './BookingStatusBadge';
import { Calendar, Clock, Video, FileText, XCircle } from 'lucide-react';
import { formatCurrency, formatDateTime, getInitials } from '@/lib/utils';
import { BookingStatus } from '@interviewiq/shared';

interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency?: string;
  keyId: string;
}

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface BookingLike {
  id: string;
  status: string;
  scheduledAt: string;
  interviewType: string;
  notes?: string | null;
  totalAmountCents: number;
  interviewerPayoutCents?: number;
  candidate?: { id?: string; name?: string; avatar?: string | null } | null;
  interviewerProfile?: {
    id?: string;
    user?: { id?: string; name?: string; avatar?: string | null };
  } | null;
  payment?: { status?: string } | null;
  interview?: { id?: string } | null;
  feedback?: { id?: string } | null;
}

interface BookingCardProps {
  booking: BookingLike;
  userRole: 'candidate' | 'interviewer';
  onCancel?: (bookingId: string) => void;
}

export function BookingCard({ booking, userRole, onCancel }: BookingCardProps) {
  const partner =
    userRole === 'candidate'
      ? booking.interviewerProfile?.user
      : booking.candidate;

  const isUpcoming =
    booking.status === BookingStatus.CONFIRMED &&
    // eslint-disable-next-line react-hooks/purity -- "now" legitimately depends on render time
    new Date(booking.scheduledAt).getTime() > Date.now();

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-lg hover:border-primary/40 transition-all">
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Calendar className="h-3.5 w-3.5" />
          {formatDateTime(booking.scheduledAt)}
        </div>
        <BookingStatusBadge status={booking.status as BookingStatus} />
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Partner Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-primary/20 shrink-0">
            <AvatarImage src={partner?.avatar || undefined} alt={partner?.name || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {getInitials(partner?.name || 'User')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm truncate">{partner?.name}</h4>
            <p className="text-xs text-muted-foreground capitalize">
              {userRole === 'candidate' ? 'Interviewer' : 'Candidate'} • {booking.interviewType.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Financial & Duration */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>60 Minutes Session</span>
          </div>
          <span className="font-bold text-foreground">
            {formatCurrency(
              userRole === 'candidate'
                ? booking.totalAmountCents
                : (booking.interviewerPayoutCents ?? booking.totalAmountCents),
            )}
          </span>
        </div>

        {/* Notes snippet */}
        {booking.notes && (
          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-border/30 line-clamp-2">
            &quot;{booking.notes}&quot;
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-wrap items-center justify-between gap-2">
        {/* Action Buttons */}
        {booking.status === BookingStatus.PENDING && userRole === 'candidate' && (
          <Button
            size="sm"
            onClick={async () => {
              const { api, getErrorMessage } = await import('@/lib/api');
              try {
                const res = await api.post('/payments/create-razorpay-order', {
                  bookingId: booking.id,
                });
                const { orderId, amount, currency, keyId }: RazorpayOrder = res.data.data;

                if (typeof window !== 'undefined' && window.Razorpay && keyId && keyId !== 'rzp_test_mock_key') {
                  const rzp = new window.Razorpay({
                    key: keyId,
                    amount,
                    currency: currency || 'INR',
                    name: 'MockMate',
                    description: 'Mock Interview Session',
                    order_id: orderId,
                    handler: async function (response: RazorpayHandlerResponse) {
                      try {
                        await api.post('/payments/verify-razorpay-payment', {
                          bookingId: booking.id,
                          razorpayOrderId: response.razorpay_order_id,
                          razorpayPaymentId: response.razorpay_payment_id,
                          razorpaySignature: response.razorpay_signature,
                        });
                        window.location.reload();
                      } catch (err) {
                        toast.error(getErrorMessage(err));
                      }
                    },
                    theme: { color: '#3B82F6' },
                  });
                  rzp.open();
                } else if (keyId === 'rzp_test_mock_key') {
                  // Mock mode (dev only): server accepts mock order verification
                  await api.post('/payments/verify-razorpay-payment', {
                    bookingId: booking.id,
                    razorpayOrderId: orderId,
                    razorpayPaymentId: `pay_mock_${Date.now()}`,
                    razorpaySignature: '',
                  });
                  window.location.reload();
                }
              } catch (err) {
                toast.error(getErrorMessage(err));
              }
            }}
            className="gap-1.5 font-semibold text-xs bg-amber-500 hover:bg-amber-600 text-black"
          >
            Pay Now to Confirm
          </Button>
        )}

        {isUpcoming && booking.interview?.id && (
          <Button asChild size="sm" className="gap-1.5 font-semibold text-xs glow-primary">
            <Link href={`/interview/${booking.interview.id}`}>
              <Video className="h-3.5 w-3.5" /> Join Room
            </Link>
          </Button>
        )}

        {booking.feedback?.id && (
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href={`/feedback/${booking.id}`}>
              <FileText className="h-3.5 w-3.5" /> View Feedback
            </Link>
          </Button>
        )}

        {(booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED) && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(booking.id)}
            className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
          >
            <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
