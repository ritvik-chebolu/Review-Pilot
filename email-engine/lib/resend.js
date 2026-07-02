/**
 * resend.js — Resend email sending wrapper for ReviewPilot.
 *
 * Uses lazy initialization so the import doesn't throw when
 * RESEND_API_KEY is not set.
 */

import { Resend } from 'resend';
import { config } from '../config.js';

const DEBUG = config.debug;

let _resend = null;

function getClient() {
  if (!_resend) {
    if (!config.apiKey) {
      throw new Error(
        'RESEND_API_KEY is not set. Set it in your environment or .env file.'
      );
    }
    _resend = new Resend(config.apiKey);
  }
  return _resend;
}

/**
 * Send an email via Resend.
 *
 * @param {object} params
 * @param {string|string[]} params.to - Recipient email(s)
 * @param {string} params.subject - Email subject line
 * @param {string} params.html - HTML body content
 * @returns {Promise<{id: string|null, error: string|null}>}
 */
export async function sendEmail({ to, subject, html }) {
  const recipients = Array.isArray(to) ? to : [to];

  if (DEBUG) {
    console.log('[Resend] Sending email...');
    console.log(`[Resend] To: ${recipients.join(', ')}`);
    console.log(`[Resend] Subject: ${subject}`);
  }

  try {
    const client = getClient();
    const result = await client.emails.send({
      from: config.from,
      to: recipients,
      subject,
      html,
    });

    if (DEBUG) {
      console.log('[Resend] Sent:', result.id);
    }

    return { id: result.id || null, error: null };
  } catch (err) {
    const errorMessage = err.message || String(err);
    console.error('[Resend] Error:', errorMessage);
    return { id: null, error: errorMessage };
  }
}