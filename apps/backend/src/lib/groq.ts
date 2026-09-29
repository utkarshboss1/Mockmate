// ============================================================
// groq.ts — Groq AI Client Singleton (llama-3.3-70b-versatile)
// ============================================================

import Groq from 'groq-sdk';
import { env } from '../config/env';

export const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

export const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
