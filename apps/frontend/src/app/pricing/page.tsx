'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PRICING_PLANS,
  PaddlePricingCard,
  type PricingPlan,
} from '@/features/billing/components/PaddlePricingCard';
import { PaddleCheckoutModal } from '@/features/billing/components/PaddleCheckoutModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  Check,
  Minus,
  HelpCircle,
  ShieldCheck,
  CreditCard,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.id === 'starter') {
      router.push('/marketplace');
      return;
    }
    if (!user) {
      toast.info('Please sign in to select this plan.');
      router.push('/login?redirect=/pricing');
      return;
    }
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (planId: string) => {
    toast.success('Subscription activated! Mock interview credits have been added.');
    router.push('/dashboard');
  };

  const faqs = [
    {
      q: 'How do mock interview session credits work?',
      a: 'When you subscribe to Pro Prep or FAANG All-Access, your session credits are immediately unlocked. You can use them to book any verified interviewer on the marketplace without paying individual session fees.',
    },
    {
      q: 'What payment methods does Paddle support?',
      a: 'Through Paddle, we support all major Credit/Debit Cards (Visa, Mastercard, Amex), UPI, NetBanking, Apple Pay, Google Pay, and PayPal with automated multi-currency conversion.',
    },
    {
      q: 'Can I cancel or pause my subscription anytime?',
      a: 'Yes, absolutely. You can cancel with one click from your billing settings. You will retain full access to all remaining session credits until the end of your billing cycle.',
    },
    {
      q: 'What happens if my interviewer does not show up?',
      a: 'MockMate provides a 100% Quality & Attendance Guarantee. If a session is interrupted or an interviewer fails to attend, your credit is immediately refunded to your account.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/25">
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" /> Paddle Billing Powered Subscriptions
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-heading leading-tight">
          Invest in Your Next <span className="text-primary italic">FAANG Offer.</span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Transparent, all-inclusive mock interview plans with verified senior engineers, actionable AI scorecards, and guaranteed feedback.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="pt-6 flex items-center justify-center gap-3">
          <span
            onClick={() => setIsAnnual(false)}
            className={`text-xs font-semibold cursor-pointer transition-colors ${
              !isAnnual ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly Billing
          </span>

          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-12 h-6 rounded-full bg-secondary border border-white/[0.1] transition-colors cursor-pointer p-0.5"
            aria-label="Toggle annual or monthly billing"
          >
            <div
              className={`w-5 h-5 rounded-full bg-primary transition-transform duration-200 shadow-md ${
                isAnnual ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>

          <span
            onClick={() => setIsAnnual(true)}
            className={`text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
              isAnnual ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual Billing
            <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] py-0 px-2 font-bold">
              Save 20%
            </Badge>
          </span>
        </div>
      </section>

      {/* ─── 3 Tier Pricing Cards Grid ──────────────────────────── */}
      <section className="container max-w-6xl px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PRICING_PLANS.map((plan) => (
            <PaddlePricingCard
              key={plan.id}
              plan={plan}
              isAnnual={isAnnual}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>
      </section>

      {/* ─── Feature Comparison Matrix Table ─────────────────────── */}
      <section className="container max-w-5xl px-4 py-20 border-t border-white/[0.06]">
        <div className="text-center space-y-3 mb-14 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading">Plan Comparison</h2>
          <p className="text-xs text-muted-foreground">
            Everything included across all MockMate subscription tiers.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="py-4 px-4 font-bold text-foreground">Features & Capabilities</th>
                <th className="py-4 px-4 font-bold text-foreground text-center">Pay-As-You-Go</th>
                <th className="py-4 px-4 font-bold text-primary text-center bg-primary/5 rounded-t-xl">
                  Pro Prep Pass
                </th>
                <th className="py-4 px-4 font-bold text-foreground text-center">FAANG All-Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Mock Sessions Included</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">Pay per session</td>
                <td className="py-3.5 px-4 text-center font-bold text-primary bg-primary/5">3 / month</td>
                <td className="py-3.5 px-4 text-center font-bold text-foreground">8 / month</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Live Monaco Code Editor</td>
                <td className="py-3.5 px-4 text-center"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                <td className="py-3.5 px-4 text-center bg-primary/5"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="h-4 w-4 text-primary mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">LiveKit WebRTC Video</td>
                <td className="py-3.5 px-4 text-center"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                <td className="py-3.5 px-4 text-center bg-primary/5"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="h-4 w-4 text-primary mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">AI Performance Scorecards</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">Standard</td>
                <td className="py-3.5 px-4 text-center font-bold text-primary bg-primary/5">Deep & Actionable</td>
                <td className="py-3.5 px-4 text-center font-bold text-foreground">Executive Analysis</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Dedicated Mentor Match</td>
                <td className="py-3.5 px-4 text-center"><Minus className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                <td className="py-3.5 px-4 text-center bg-primary/5"><Minus className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="h-4 w-4 text-primary mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Salary Negotiation Coaching</td>
                <td className="py-3.5 px-4 text-center"><Minus className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                <td className="py-3.5 px-4 text-center bg-primary/5"><Minus className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="h-4 w-4 text-primary mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── FAQ Section ────────────────────────────────────────── */}
      <section className="container max-w-4xl px-4 py-20 border-t border-white/[0.06]">
        <div className="text-center space-y-3 mb-14 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading">Frequently Asked Questions</h2>
          <p className="text-xs text-muted-foreground">Everything you need to know about billing and subscriptions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="border-white/[0.06] bg-card/60 p-6 space-y-2">
              <h4 className="text-sm font-bold text-foreground font-heading">{faq.q}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Checkout Modal */}
      <PaddleCheckoutModal
        plan={selectedPlan}
        isAnnual={isAnnual}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}
