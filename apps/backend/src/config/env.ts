// ============================================================
// env.ts — Zod-validated environment variables
// ============================================================

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().default('postgresql://mockmate:mockmate@localhost:5432/mockmate?schema=public'),

  // Storage mode
  // - "memory"   : in-process Maps. Lets the app boot and run end-to-end
  //                without a reachable DB. Used on college IPv4 LANs.
  // - "database" : every read/write goes through Prisma. Fails fast if DB is
  //                unreachable. This is the only mode allowed in production.
  STORAGE_MODE: z.enum(['memory', 'database']).default('memory'),

  // Better Auth
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters')
    .default(isProduction ? '' : 'development_secret_key_32_characters_minimum_entropy'),
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
  EMAIL_FROM: z.string().default('notifications@mockmate.in'),

  // Groq AI
  GROQ_API_KEY: z.string().default(''),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().default('rzp_test_mock_key'),
  RAZORPAY_KEY_SECRET: z.string().default('mock_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('mock_webhook_secret'),

  // Redis (Socket.IO adapter, rate-limit store)
  REDIS_URL: z.string().default(''),

  DIRECT_URL: z.string().default(''),

  // Dev-only escape hatch. In production this must be false; mock
  // tokens (`mock-token-admin`, etc.) must never authenticate anyone.
  ALLOW_MOCK_AUTH: z
    .string()
    .default('true')
    .transform((val) => val === 'true')
    .refine((val) => isProduction ? !val : true, {
      message: 'ALLOW_MOCK_AUTH must be false in production',
    }),
});

// Production must never boot on development defaults. Any of these falling
// through means a real deploy is running on mock keys — silent footgun.
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

const parsed = envSchema
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') return;

    // Memory storage must never run in production — it has no persistence
    // and would silently drop every user, booking, and payment on restart.
    if (data.STORAGE_MODE === 'memory') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['STORAGE_MODE'],
        message: 'STORAGE_MODE="memory" is not allowed in production. Use "database".',
      });
    }

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
  })
  .safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
