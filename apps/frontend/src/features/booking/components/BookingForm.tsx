'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getErrorMessage } from '@/lib/api';
import { SlotPicker } from '@/features/availability/components/SlotPicker';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InterviewType } from '@interviewiq/shared';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, getInitials } from '@/lib/utils';
import { Loader2, AlertCircle, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

interface BookingFormProps {
  interviewer: {
    id: string;
    headline: string;
    pricePerHour: number; // in paise
    user: {
      name: string;
      avatar: string | null;
    };
  };
}

export function BookingForm({ interviewer }: BookingFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null);
  const [interviewType, setInterviewType] = useState<InterviewType>(InterviewType.TECHNICAL_CODING);
  const [notes, setNotes] = useState('');

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

      const response = await api.post('/bookings', {
        interviewerProfileId: interviewer.id,
        scheduledAt: selectedSlotIso,
        interviewType,
        notes,
      });

      const booking = response.data.data;

      // Initiate Razorpay / Instant Payment Checkout
      try {
        const orderRes = await api.post('/payments/create-razorpay-order', {
          bookingId: booking.id,
        });

        const { orderId, amount, currency, keyId } = orderRes.data.data;

        if (typeof window !== 'undefined' && (window as any).Razorpay && keyId && keyId !== 'rzp_test_mock_key') {
          const options = {
            key: keyId,
            amount: amount,
            currency: currency || 'INR',
            name: 'MockMate',
            description: `1-on-1 ${interviewType} Mock Interview`,
            order_id: orderId,
            handler: async function (response: any) {
              await api.post('/payments/verify-razorpay-payment', {
                bookingId: booking.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              router.push(`/dashboard?payment=success&bookingId=${booking.id}`);
            },
            prefill: {
              name: user?.name,
              email: user?.email,
            },
            theme: {
              color: '#3B82F6',
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          return;
        }
      } catch (e) {
        console.warn('Razorpay checkout initialization notice:', e);
      }

      router.push(`/dashboard?bookingCreated=${booking.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Main Booking Controls */}
      <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
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
            <Label htmlFor="interviewType">3. Interview Type / Focus Area</Label>
            <Select value={interviewType} onValueChange={(val) => setInterviewType(val as InterviewType)}>
              <SelectTrigger id="interviewType">
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
            <Label htmlFor="notes">4. Topics or Companies You Are Preparing For (Optional)</Label>
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
          <CardTitle className="text-lg">Booking Summary</CardTitle>
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
              <span className="text-primary">{formatCurrency(interviewer.pricePerHour)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Encrypted payment. Free cancellation up to 24h before session.</span>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button
            onClick={handleSubmitBooking}
            className="w-full font-semibold gap-2 glow-primary"
            disabled={loading || !selectedSlotIso}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirm & Proceed <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
