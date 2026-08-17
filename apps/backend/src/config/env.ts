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
  GROQ_API_KEY: z.string().default('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'),

  // Auth Controls
  ALLOW_MOCK_AUTH: z.string().default('true').transform((val) => val === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
