// ============================================================
// env.ts — Zod-validated environment variables
// ============================================================

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/interviewiq?schema=public'),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().default('development_secret_key_32_characters_minimum_entropy'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:4000'),

  // LiveKit
  LIVEKIT_API_KEY: z.string().default('devkey'),
  LIVEKIT_API_SECRET: z.string().default('secret'),
  LIVEKIT_URL: z.string().default('wss://demo.livekit.cloud'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().default('demo'),
  CLOUDINARY_API_KEY: z.string().default('123456789'),
  CLOUDINARY_API_SECRET: z.string().default('abcdefghijklmnopqrstuvwxyz'),

  // Resend
  RESEND_API_KEY: z.string().default('re_123456789_mock_key'),
  EMAIL_FROM: z.string().default('notifications@interviewiq.com'),

  // Groq AI
  GROQ_API_KEY: z.string().default(''),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().default('rzp_test_mock_key'),
  RAZORPAY_KEY_SECRET: z.string().default('mock_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('mock_webhook_secret'),

  DIRECT_URL: z.string().default(''),

  // Auth Controls
  ALLOW_MOCK_AUTH: z.string().default('true').transform((val) => val === 'true'),
});

// Secrets must never fall back to insecure development defaults in production.
const INSECURE_PRODUCTION_DEFAULTS: Array<[keyof z.infer<typeof envSchema>, string[]]> = [
  ['BETTER_AUTH_SECRET', ['development_secret_key_32_characters_minimum_entropy']],
  ['LIVEKIT_API_KEY', ['devkey']],
  ['LIVEKIT_API_SECRET', ['secret']],
  ['CLOUDINARY_API_SECRET', ['abcdefghijklmnopqrstuvwxyz']],
  ['RESEND_API_KEY', ['re_123456789_mock_key']],
  ['RAZORPAY_KEY_ID', ['rzp_test_mock_key']],
  ['RAZORPAY_KEY_SECRET', ['mock_secret']],
  ['RAZORPAY_WEBHOOK_SECRET', ['mock_webhook_secret']],
];

const parsed = envSchema.superRefine((data, ctx) => {
  if (data.NODE_ENV !== 'production') return;

  for (const [key, forbidden] of INSECURE_PRODUCTION_DEFAULTS) {
    if (!data[key] || forbidden.includes(data[key] as string)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${String(key)} must be set to a real value in production`,
      });
    }
  }

  if (!data.GROQ_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['GROQ_API_KEY'],
      message: 'GROQ_API_KEY must be set in production',
    });
  }
}).safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
