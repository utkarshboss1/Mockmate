'use client';

import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function BillingManagementView() {
  return (
    <Card className="border-white/[0.08] bg-card/80 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold font-heading text-foreground">
          <CreditCard className="h-5 w-5 text-primary" /> Billing
        </CardTitle>
        <CardDescription>
          Subscription checkout and billing history are not available yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Individual interview payments are tied to their bookings.</p>
        <Link href="/pricing" className="text-primary hover:underline">
          View plan information
        </Link>
      </CardContent>
    </Card>
  );
}
