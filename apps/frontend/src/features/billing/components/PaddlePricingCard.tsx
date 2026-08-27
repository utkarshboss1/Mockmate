'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Sparkles, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPriceINR: number;
  annualPriceINR: number;
  popular?: boolean;
  badge?: string;
  features: string[];
  ctaText: string;
  limits: {
    interviews: string;
    aiScorecards: string;
    mentorChat: string;
    support: string;
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Pay-As-You-Go',
    tagline: 'Ideal for candidates trying out their first 1-on-1 technical mock interview.',
    monthlyPriceINR: 0,
    annualPriceINR: 0,
    features: [
      'Book individual 60-min sessions on-demand',
      'Pay standard interviewer rates (from ₹500/hr)',
      'Full Monaco code workspace & LiveKit video',
      'Standard AI session scorecards & rubric feedback',
      'Direct in-browser chat with interviewer',
    ],
    ctaText: 'Browse Marketplace',
    limits: {
      interviews: 'Pay per session',
      aiScorecards: 'Standard',
      mentorChat: 'During session only',
      support: 'Standard email',
    },
  },
  {
    id: 'pro',
    name: 'Pro Prep Pass',
    tagline: 'For active job seekers preparing for L4/L5 & Senior SWE interview loops.',
    monthlyPriceINR: 2999,
    annualPriceINR: 2399,
    popular: true,
    badge: 'Most Popular',
    features: [
      '3 full 60-min mock interviews included / month',
      'Priority booking access with Google & Meta staff engineers',
      'Deep AI Code Complexity & Rubric Analytics',
      '1 Comprehensive Resume & LinkedIn Review / month',
      'Personalized DSA & System Design study roadmaps',
      'Unlimited video session replay & code exports',
    ],
    ctaText: 'Start Pro Prep',
    limits: {
      interviews: '3 sessions / mo',
      aiScorecards: 'Advanced & Actionable',
      mentorChat: 'Priority asynchronous chat',
      support: '24-hour SLA',
    },
  },
  {
    id: 'faang_loop',
    name: 'FAANG All-Access',
    tagline: 'Complete comprehensive interview prep with dedicated mentoring & guarantees.',
    monthlyPriceINR: 6999,
    annualPriceINR: 5599,
    badge: 'Maximum Prep',
    features: [
      '8 full 60-min mock interviews included / month',
      'Dedicated Staff+ Engineer mentor matching',
      'Full System Design Architecture deep-dive loops',
      'Mock Behavioral & Leadership Principle rounds',
      'Live salary negotiation & counter-offer coaching',
      '100% Session Quality Guarantee or free rematch',
    ],
    ctaText: 'Get All-Access',
    limits: {
      interviews: '8 sessions / mo',
      aiScorecards: 'Executive rubric + AI audio analysis',
      mentorChat: '1-on-1 Direct mentor access',
      support: 'Dedicated Slack channel',
    },
  },
];

interface PaddlePricingCardProps {
  plan: PricingPlan;
  isAnnual: boolean;
  onSelectPlan: (plan: PricingPlan) => void;
}

export function PaddlePricingCard({ plan, isAnnual, onSelectPlan }: PaddlePricingCardProps) {
  const price = isAnnual ? plan.annualPriceINR : plan.monthlyPriceINR;

  return (
    <Card
      className={`relative flex flex-col justify-between rounded-2xl transition-all duration-300 backdrop-blur-xl ${
        plan.popular
          ? 'border-primary/60 bg-gradient-to-b from-[#1E1B4B]/60 via-card/90 to-card shadow-2xl shadow-primary/10 ring-1 ring-primary/40 -translate-y-1'
          : 'border-white/[0.08] bg-card/70 hover:border-white/[0.2] hover:bg-card/90'
      }`}
    >
      {/* Top Floating Badge */}
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge
            className={`px-3.5 py-0.5 text-[11px] font-bold tracking-wider uppercase rounded-full shadow-md ${
              plan.popular
                ? 'bg-primary text-primary-foreground border-none'
                : 'bg-secondary text-secondary-foreground border-white/[0.1]'
            }`}
          >
            <Sparkles className="h-3 w-3 mr-1 inline" /> {plan.badge}
          </Badge>
        </div>
      )}

      <CardContent className="p-7 space-y-6 flex-1 flex flex-col justify-between">
        {/* Tier Header */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-heading text-foreground">{plan.name}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
              {plan.tagline}
            </p>
          </div>

          {/* Pricing Block */}
          <div className="pt-2 pb-4 border-b border-white/[0.06]">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground">
                {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
              </span>
              {price > 0 && (
                <span className="text-xs text-muted-foreground font-medium">
                  / month {isAnnual && <span className="text-primary text-[11px]">(billed yearly)</span>}
                </span>
              )}
            </div>
            {isAnnual && price > 0 && (
              <p className="text-[11px] text-emerald-400 mt-1 font-medium">
                Save ₹{((plan.monthlyPriceINR - plan.annualPriceINR) * 12).toLocaleString('en-IN')} annually
              </p>
            )}
          </div>

          {/* Features List */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              What's Included:
            </div>
            <ul className="space-y-2.5">
              {plan.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90 leading-normal">
                  <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-6 mt-6 border-t border-white/[0.06]">
          <Button
            onClick={() => onSelectPlan(plan)}
            className={`w-full h-11 text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 ${
              plan.popular
                ? 'glow-primary bg-primary text-primary-foreground hover:opacity-90'
                : 'border border-white/[0.12] bg-secondary/80 text-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {plan.ctaText} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
