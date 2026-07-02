/**
 * index.js — ReviewPilot Email Notification Engine
 *
 * Unified entry point for sending email notifications via Resend.
 *
 * Usage:
 *   import { sendNegativeAlert, sendDailyDigest, sendWeeklySummary } from './index.js';
 *
 *   // Immediate alert for a negative review
 *   await sendNegativeAlert({
 *     businessName: 'Downtown Dental',
 *     ownerEmail: 'dentist@example.com',
 *     review: { rating: 2, reviewerName: 'Sam', reviewText: 'Disappointed...', aiDraftReply: 'Hi Sam...' },
 *   });
 *
 *   // Daily digest (end of day)
 *   await sendDailyDigest({
 *     businessName: 'Downtown Dental',
 *     businessEmail: 'dentist@example.com',
 *     reviews: [/* all reviews from today */],
 *     dateLabel: 'June 28, 2026',
 *   });
 *
 *   // Weekly summary (end of week)
 *   await sendWeeklySummary({ ...stats ... });
 *
 * Environment variables (see .env.example):
 *   RESEND_API_KEY     — required for actual sending
 *   EMAIL_FROM         — sender address (default: reviews@reviewpilot.app)
 */

import { sendEmail } from './lib/resend.js';
import {
  processNewReview,
  buildDailyDigest,
  buildWeeklySummary,
} from './services/notificationService.js';

// ─── High-Level Senders ──────────────────────────────────────────────────────

/**
 * Send an immediate negative review alert email.
 * Convenience wrapper: processes a review and sends the alert in one call.
 */
export async function sendNegativeAlert({ businessName, ownerEmail, review, options = {} }) {
  const business = { name: businessName, email: ownerEmail };
  const notifications = processNewReview(review, business, {
    aiDraftReply: options.aiDraftReply || review.aiDraftReply || '',
    approveUrl: options.approveUrl || '#',
    editUrl: options.editUrl || '#',
  });

  const results = [];
  for (const notif of notifications) {
    const result = await sendEmail({
      to: notif.to,
      subject: notif.subject,
      html: notif.html,
    });
    results.push({ type: notif.type, ...result });
  }
  return results;
}

/**
 * Send a daily digest email with accumulated reviews.
 */
export async function sendDailyDigest({ businessName, businessEmail, reviews, dateLabel }) {
  const digest = buildDailyDigest({ businessName, businessEmail, reviews, dateLabel });
  if (!digest) return { sent: false, reason: 'no_reviews' };

  const result = await sendEmail({
    to: digest.to,
    subject: digest.subject,
    html: digest.html,
  });
  return { type: 'daily_digest', ...result };
}

/**
 * Send a weekly reputation summary email.
 */
export async function sendWeeklySummary(params) {
  const { businessName, businessEmail } = params;
  const summary = buildWeeklySummary({ ...params });

  const result = await sendEmail({
    to: summary.to,
    subject: summary.subject,
    html: summary.html,
  });
  return { type: 'weekly_summary', ...result };
}

// ─── Lower-Level Exports ─────────────────────────────────────────────────────

export { sendEmail } from './lib/resend.js';
export {
  processNewReview,
  buildDailyDigest,
  buildWeeklySummary,
} from './services/notificationService.js';
export { config } from './config.js';