// ============================================================
// groq.ts — Groq AI Client Singleton (llama-3.3-70b-versatile)
// ============================================================

import Groq from 'groq-sdk';
import { env } from '../config/env';

export const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

export const GROQ_MODEL = 'llama-3.3-70b-versatile';
