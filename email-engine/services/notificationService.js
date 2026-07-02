/**
 * notificationService.js — Decision logic for which emails to send.
 *
 * Processes review data and determines the appropriate notification:
 * - Negative review alert (immediate, for 1-2 star reviews)
 * - Daily digest (accumulated reviews throughout a day)
 * - Weekly summary (every 7 days)
 *
 * Pure logic — no actual email sending. Returns what should be sent,
 * which the caller can then dispatch via resend.js.
 */

import { buildNegativeAlertHtml } from '../templates/negative-alert.js';
import { buildDailyDigestHtml } from '../templates/daily-digest.js';
import { buildWeeklySummaryHtml } from '../templates/weekly-summary.js';

/**
 * Determine what notifications to send for a single new review.
 *
 * @param {object} review
 * @param {number} review.rating - 1-5
 * @param {string} review.reviewerName
 * @param {string} review.comment
 * @param {string} [review.reviewDate]
 * @param {object} business
 * @param {string} business.name
 * @param {string} business.email - Business owner's email
 * @param {object} [options]
 * @param {string} options.aiDraftReply - AI-generated draft response
 * @param {string} options.approveUrl - URL to approve the reply
 * @param {string} options.editUrl - URL to edit the reply
 * @returns {Array<{type: string, to: string, subject: string, html: string}>} Notifications to send
 */
export function processNewReview(review, business, options = {}) {
  const { aiDraftReply = '', approveUrl = '#', editUrl = '#' } = options;
  const notifications = [];

  // Negative reviews (1-2 stars) trigger immediate alert
  if (review.rating <= 2) {
    const html = buildNegativeAlertHtml({
      businessName: business.name,
      rating: review.rating,
      reviewerName: review.reviewerName || 'A customer',
      reviewText: review.comment,
      reviewDate: review.reviewDate || new Date().toISOString().split('T')[0],
      aiDraftReply,
      approveUrl,
      editUrl,
    });

    notifications.push({
      type: 'negative_alert',
      to: business.email,
      subject: `⚠️ ${review.rating}-star review from ${review.reviewerName || 'a customer'} — ${business.name}`,
      html,
      priority: 'high',
    });
  }

  return notifications;
}

/**
 * Build a daily digest notification from accumulated reviews.
 *
 * @param {object} params
 * @param {string} params.businessName
 * @param {string} params.businessEmail
 * @param {Array} params.reviews - All reviews detected today
 * @param {string} params.dateLabel - Human-readable date
 * @returns {{type: string, to: string, subject: string, html: string}|null}
 */
export function buildDailyDigest({ businessName, businessEmail, reviews, dateLabel }) {
  if (!reviews || reviews.length === 0) return null;

  // Only send digest if there are reviews that weren't already alerted as negative
  // (negative reviews get immediate alerts AND appear in the digest for consolidated view)
  const enriched = reviews.map((r) => ({
    ...r,
    reviewText: r.comment,
    reviewDate: r.reviewDate || r.date || '',
  }));

  const html = buildDailyDigestHtml({
    businessName,
    date: dateLabel,
    reviews: enriched,
    totalNew: enriched.length,
  });

  return {
    type: 'daily_digest',
    to: businessEmail,
    subject: `📬 Daily Review Digest — ${businessName} (${enriched.length} new)`,
    html,
    priority: 'normal',
  };
}

/**
 * Build a weekly reputation summary notification.
 *
 * @param {object} params
 * @param {string} params.businessName
 * @param {string} params.businessEmail
 * @param {string} params.weekLabel - e.g. "Jun 28 — Jul 4, 2026"
 * @param {object} params.stats
 * @param {number} params.stats.totalReviews
 * @param {number} params.stats.averageRating
 * @param {number} params.stats.previousAverageRating
 * @param {number} params.stats.responseRate
 * @param {number} params.stats.newReviewsThisWeek
 * @param {number} params.stats.negativeCount
 * @param {number} params.stats.positiveCount
 * @param {number[]} params.stats.ratingDistribution - [1-star, 2-star, 3-star, 4-star, 5-star]
 * @param {Array} [params.topReviews] - Best reviews
 * @param {Array} [params.reviewsNeedingResponse] - Reviews without a reply
 * @param {string} [params.dashboardUrl]
 * @returns {{type: string, to: string, subject: string, html: string}}
 */
export function buildWeeklySummary(params) {
  const {
    businessName,
    businessEmail,
    weekLabel,
    stats,
    topReviews = [],
    reviewsNeedingResponse = [],
    dashboardUrl = '#',
  } = params;

  const html = buildWeeklySummaryHtml({
    businessName,
    weekLabel,
    stats,
    topReviews,
    reviewsNeedingResponse,
    dashboardUrl,
  });

  const trendEmoji = stats.averageRating > stats.previousAverageRating ? '📈' : stats.averageRating < stats.previousAverageRating ? '📉' : '➡️';

  return {
    type: 'weekly_summary',
    to: businessEmail,
    subject: `${trendEmoji} Weekly Reputation Report — ${businessName} (${stats.averageRating.toFixed(1)}★, ${stats.newReviewsThisWeek} new)`,
    html,
    priority: 'normal',
  };
}