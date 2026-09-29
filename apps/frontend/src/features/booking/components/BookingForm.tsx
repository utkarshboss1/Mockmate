'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InterviewType } from '@interviewiq/shared';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SlotPicker } from '@/features/availability/components/SlotPicker';
import { Calendar, ShieldCheck, ArrowRight, Loader2, AlertCircle, CreditCard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface BookingFormProps {
  interviewer: {
    id: string;
    userId: string;
    headline: string;
    pricePerHour: number;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  };
}

interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const loadRazorpaySDK = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function BookingForm({ interviewer }: BookingFormProps) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null);
  const [interviewType, setInterviewType] = useState<InterviewType>(InterviewType.TECHNICAL_CODING);
  const [notes, setNotes] = useState('');
  const hasCredits = Boolean(user?.interviewCredits && user.interviewCredits > 0);
  const [useCredit, setUseCredit] = useState<boolean>(hasCredits);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitBooking = async () => {
    if (!selectedSlotIso) {
      setError('Please select a date and time slot for your interview');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // If user chooses to book using their active pass credit
      if (useCredit && hasCredits) {
        const response = await api.post('/bookings', {
          interviewerProfileId: interviewer.id,
          scheduledAt: selectedSlotIso,
          interviewType,
          notes,
          useCredit: true,
        });

        await refreshUser();
        toast.success('Session confirmed using 1 Pro Prep credit!');
        router.push(`/dashboard?payment=success&bookingId=${response.data.data.id}`);
        return;
      }

      // 1. Create the booking record
      const response = await api.post('/bookings', {
        interviewerProfileId: interviewer.id,
        scheduledAt: selectedSlotIso,
        interviewType,
        notes,
      });

      const booking = response.data.data;

      // 2. Create the Razorpay Order from backend
      const orderRes = await api.post('/payments/create-razorpay-order', {
        bookingId: booking.id,
      });

      const { orderId, amount, currency, keyId }: RazorpayOrder = orderRes.data.data;

      // 3. Ensure Razorpay Checkout SDK is ready
      const isSdkLoaded = await loadRazorpaySDK();
      if (!isSdkLoaded) {
        toast.error('Failed to load Razorpay payment gateway. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // 4. Open the Razorpay Payment Modal
      const options = {
        key: keyId || 'rzp_test_TRXiLextFCLkcj',
        amount: amount,
        currency: currency || 'INR',
        name: 'MockMate',
        description: `1-on-1 ${interviewType.replace('_', ' ')} Mock Interview with ${interviewer.user.name}`,
        order_id: orderId,
        handler: async function (paymentRes: RazorpayHandlerResponse) {
          try {
            setLoading(true);
            await api.post('/payments/verify-razorpay-payment', {
              bookingId: booking.id,
              razorpayOrderId: paymentRes.razorpay_order_id,
              razorpayPaymentId: paymentRes.razorpay_payment_id,
              razorpaySignature: paymentRes.razorpay_signature,
            });

            toast.success('Payment verified! Your session is confirmed.');
            router.push(`/dashboard?payment=success&bookingId=${booking.id}`);
          } catch (verifyErr) {
            toast.error(getErrorMessage(verifyErr));
            setError('Payment verification failed. If your money was deducted, please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#F97316', // MockMate primary coral theme
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.info('Payment window closed. Your reservation is pending payment.');
            router.push(`/dashboard?bookingPending=${booking.id}`);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setLoading(false);
        toast.error(resp?.error?.description || 'Payment transaction failed. Please retry.');
      });

      rzp.open();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Main Booking Controls */}
      <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2 font-heading">
            <Calendar className="h-6 w-6 text-primary" /> Book Mock Interview
          </CardTitle>
          <CardDescription>
            Select your preferred slot and interview focus to reserve a 60-minute session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Slot Picker */}
          <SlotPicker
            interviewerProfileId={interviewer.id}
            selectedSlotIso={selectedSlotIso}
            onSelectSlot={setSelectedSlotIso}
          />

          {/* Interview Type Selection */}
          <div className="space-y-2 pt-4 border-t border-border/40">
            <Label htmlFor="interviewType" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Interview Type / Focus Area
            </Label>
            <Select value={interviewType} onValueChange={(val) => setInterviewType(val as InterviewType)}>
              <SelectTrigger id="interviewType" className="h-11">
                <SelectValue placeholder="Select interview type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={InterviewType.TECHNICAL_CODING}>Technical Coding (DSA)</SelectItem>
                <SelectItem value={InterviewType.SYSTEM_DESIGN}>System Design Architecture</SelectItem>
                <SelectItem value={InterviewType.BEHAVIORAL}>Behavioral & Leadership</SelectItem>
                <SelectItem value={InterviewType.RESUME_REVIEW}>Resume Review & Critique</SelectItem>
                <SelectItem value={InterviewType.MOCK_FULL}>Full Mock Loop (Coding + Behavioral)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prep Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Topics or Companies You Are Preparing For (Optional)
            </Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="e.g., Preparing for Senior SDE at Amazon. Want to practice Dynamic Programming & Trees..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Sidebar */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl sticky top-20">
        <CardHeader className="pb-4 border-b border-border/40">
          <CardTitle className="text-lg font-heading">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-primary/20 shrink-0">
              <AvatarImage src={interviewer.user.avatar || undefined} alt={interviewer.user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {getInitials(interviewer.user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-sm">{interviewer.user.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">{interviewer.headline}</p>
            </div>
          </div>

          {hasCredits && (
            <div className="p-3 rounded-xl border border-primary/40 bg-primary/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Pro Prep Pass Active
                </span>
                <Badge className="bg-primary/20 text-primary text-[10px] font-bold">
                  {user?.interviewCredits} Credits Left
                </Badge>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer text-foreground">
                <input
                  type="checkbox"
                  checked={useCredit}
                  onChange={(e) => setUseCredit(e.target.checked)}
                  className="rounded border-white/[0.2] text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer"
                />
                <span>Use 1 session credit (₹0 due today)</span>
              </label>
            </div>
          )}

          <div className="space-y-2 text-xs text-muted-foreground pt-4 border-t border-border/40">
            <div className="flex justify-between">
              <span>Session Duration:</span>
              <span className="font-semibold text-foreground">60 Minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Rate:</span>
              <span className="font-semibold text-foreground">{formatCurrency(interviewer.pricePerHour)} / hr</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border/40">
              <span>Total Price:</span>
              <span className="text-primary font-heading text-base font-extrabold">
                {useCredit && hasCredits ? '₹0 (1 Credit)' : formatCurrency(interviewer.pricePerHour)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              {useCredit && hasCredits
                ? 'Covered by Pro Prep Pass. Free cancellation up to 2h before session.'
                : 'Secured via Razorpay. Free cancellation up to 2h before session.'}
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button
            onClick={handleSubmitBooking}
            className="w-full h-11 text-xs font-bold gap-2 glow-primary cursor-pointer"
            disabled={loading || !selectedSlotIso}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing booking...
              </>
            ) : useCredit && hasCredits ? (
              <>
                <Sparkles className="h-4 w-4" /> Book with 1 Session Credit <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" /> Pay & Confirm Booking <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
