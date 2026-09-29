// ============================================================
// payments.validator.ts — Payment Validation Schemas
// ============================================================

import { z } from 'zod';

export const createRazorpayOrderSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

export type CreateRazorpayOrderInput = z.infer<typeof createRazorpayOrderSchema>;

export const verifyRazorpayPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});

export type VerifyRazorpayPaymentInput = z.infer<typeof verifyRazorpayPaymentSchema>;

export const purchasePassSchema = z.object({
  planId: z.enum(['pro', 'faang_loop']),
  isAnnual: z.boolean().default(false),
  promoCode: z.string().optional(),
});

export type PurchasePassInput = z.infer<typeof purchasePassSchema>;

