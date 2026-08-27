'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  X,
  ShieldCheck,
  Lock,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  Tag,
} from 'lucide-react';
import type { PricingPlan } from './PaddlePricingCard';

interface PaddleCheckoutModalProps {
  plan: PricingPlan | null;
  isAnnual: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (planId: string) => void;
}

export function PaddleCheckoutModal({
  plan,
  isAnnual,
  isOpen,
  onClose,
  onSuccess,
}: PaddleCheckoutModalProps) {
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponApplied, setCouponApplied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !plan) return null;

  const basePrice = isAnnual ? plan.annualPriceINR * 12 : plan.monthlyPriceINR;
  const discountAmount = Math.round((basePrice * discountPercent) / 100);
  const subtotal = basePrice - discountAmount;
  const gstTax = Math.round(subtotal * 0.18); // 18% GST
  const finalTotal = subtotal + gstTax;

  const handleApplyCoupon = () => {
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();
    if (code === 'MOCK20' || code === 'FAANG20') {
      setDiscountPercent(20);
      setCouponApplied(true);
    } else if (code === 'LAUNCH50') {
      setDiscountPercent(50);
      setCouponApplied(true);
    } else {
      setCouponError('Invalid promo code. Try "FAANG20" for 20% off!');
    }
  };

  const handlePayNow = async () => {
    setProcessing(true);
    // Simulate Paddle Checkout Overlay completion
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setProcessing(false);
    setSuccess(true);
    setTimeout(() => {
      onSuccess(plan.id);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#121226] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Header with Paddle Security Badge */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-heading text-foreground">Paddle Secure Checkout</span>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/40 bg-primary/10 text-primary">
                MoR Powered
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              MockMate • {plan.name} ({isAnnual ? 'Annual Subscription' : 'Monthly Subscription'})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold font-heading text-foreground">Subscription Activated!</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Your {plan.name} plan is now active. Your mock interview sessions have been credited to your account.
            </p>
          </div>
        ) : (
          <>
            {/* Plan Summary Card */}
            <div className="p-4 rounded-xl bg-card/60 border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">{plan.name}</span>
                <span className="font-bold text-foreground">₹{basePrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Includes {plan.limits.interviews}, {plan.limits.aiScorecards} AI scorecards, and priority matching.
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Promo code (e.g. FAANG20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="pl-8 text-xs bg-background/80 border-white/[0.1] h-9"
                    disabled={couponApplied}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyCoupon}
                  disabled={couponApplied || !couponCode.trim()}
                  className="text-xs h-9 px-3 border-white/[0.1] cursor-pointer"
                >
                  {couponApplied ? 'Applied' : 'Apply'}
                </Button>
              </div>
              {couponError && <p className="text-[11px] text-destructive">{couponError}</p>}
              {couponApplied && (
                <p className="text-[11px] text-emerald-400 font-medium">
                  ✓ {discountPercent}% discount applied successfully!
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs pt-2 border-t border-white/[0.06]">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{basePrice.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({discountPercent}%)</span>
                  <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Tax (18% GST)</span>
                <span>₹{gstTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-white/[0.06]">
                <span>Total Due Today</span>
                <span className="text-primary font-heading text-base font-extrabold">
                  ₹{finalTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handlePayNow}
                disabled={processing}
                className="w-full h-11 text-xs font-bold glow-primary bg-primary text-primary-foreground rounded-xl cursor-pointer"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing with Paddle...
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 mr-1.5" /> Pay ₹{finalTotal.toLocaleString('en-IN')} via Paddle
                  </>
                )}
              </Button>

              {/* Trust Footnote */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" /> 256-bit SSL Encrypted
                </span>
                <span>•</span>
                <span>Cancel Anytime</span>
                <span>•</span>
                <span>Merchant of Record</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
