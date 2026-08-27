// ============================================================
// email.ts — Transactional Email Helper (Resend SDK)
//
// WHY: Wraps third-party email provider behind an isolated helper.
// Falls back to logging if RESEND_API_KEY is not configured.
// ============================================================

import { Resend } from 'resend';
import { env } from '../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log(`[Email Mock Output] To: ${params.to} | Subject: ${params.subject}`);
    return { id: 'mock_email_id' };
  }

  try {
    return await resend.emails.send({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (error) {
    console.error('Failed to send transactional email via Resend:', error);
    return null;
  }
}
