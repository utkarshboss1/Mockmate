'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export function BillingManagementView() {
  const [cancelling, setCancelling] = useState(false);

  const mockInvoices = [
    {
      id: 'inv_paddle_10829',
      date: 'Aug 15, 2026',
      description: 'Pro Prep Pass (Monthly)',
      amount: '₹2,999.00',
      status: 'Paid',
    },
    {
      id: 'inv_paddle_10542',
      date: 'Jul 15, 2026',
      description: 'Pro Prep Pass (Monthly)',
      amount: '₹2,999.00',
      status: 'Paid',
    },
    {
      id: 'inv_paddle_10190',
      date: 'Jun 15, 2026',
      description: 'Pay-As-You-Go Session (Sarah Chen)',
      amount: '₹1,200.00',
      status: 'Paid',
    },
  ];

  const handleDownloadInvoice = (invId: string) => {
    toast.success(`Downloaded tax receipt PDF for ${invId}`);
  };

  const handleCancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your Pro Prep subscription? You will retain access until the end of your billing period.')) {
      setCancelling(true);
      setTimeout(() => {
        setCancelling(false);
        toast.info('Your subscription will not renew after Sep 15, 2026.');
      }, 1000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Plan Overview Card */}
      <Card className="border-white/[0.08] bg-card/80 backdrop-blur-xl">
        <CardHeader className="pb-4 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <CardTitle className="text-xl font-bold font-heading text-foreground">
                  Pro Prep Pass
                </CardTitle>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold">
                  Active
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1 text-muted-foreground">
                Next billing cycle on <span className="text-foreground font-semibold">September 15, 2026</span> (₹2,999/month)
              </CardDescription>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-white/[0.1] hover:bg-card cursor-pointer"
                asChild
              >
                <Link href="/pricing">Change Plan</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                Cancel Plan
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-secondary/40 border border-white/[0.04] space-y-1">
            <div className="text-muted-foreground">Available Credits</div>
            <div className="text-2xl font-bold text-primary font-heading">2 Sessions</div>
            <div className="text-[10px] text-muted-foreground">Renews on Sep 15</div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/40 border border-white/[0.04] space-y-1">
            <div className="text-muted-foreground">AI Scorecards</div>
            <div className="text-2xl font-bold text-foreground font-heading">Unlimited</div>
            <div className="text-[10px] text-muted-foreground">Deep rubric analytics</div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/40 border border-white/[0.04] space-y-1">
            <div className="text-muted-foreground">Payment Method</div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2 mt-1">
              <CreditCard className="h-4 w-4 text-primary" /> Visa •••• 4242
            </div>
            <div className="text-[10px] text-muted-foreground">Managed via Paddle MoR</div>
          </div>
        </CardContent>
      </Card>

      {/* Paddle Invoices & Billing History */}
      <Card className="border-white/[0.08] bg-card/80 backdrop-blur-xl">
        <CardHeader className="pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold font-heading text-foreground">
                Invoices & Payment History
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Download tax invoices and receipts issued by Paddle Merchant of Record.
              </CardDescription>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Paddle Verified
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-muted-foreground">
                  <th className="py-3 px-6 font-semibold">Date</th>
                  <th className="py-3 px-6 font-semibold">Description</th>
                  <th className="py-3 px-6 font-semibold">Amount</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {mockInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 font-medium text-foreground">{inv.date}</td>
                    <td className="py-3.5 px-6 text-foreground/90">{inv.description}</td>
                    <td className="py-3.5 px-6 font-bold text-foreground">{inv.amount}</td>
                    <td className="py-3.5 px-6">
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(inv.id)}
                        className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer font-medium"
                      >
                        <Download className="h-3 w-3" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
