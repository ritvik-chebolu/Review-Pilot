/**
 * daily-digest.js — HTML template for the daily review digest.
 *
 * Sent if new reviews accumulated during the day. Lists all new reviews
 * with their AI-drafted replies, grouped by sentiment.
 */

/**
 * Build the daily digest email HTML.
 *
 * @param {object} data
 * @param {string} data.businessName
 * @param {string} data.date - Date string for the digest
 * @param {Array<object>} data.reviews - Array of review objects
 *   Each review: { rating, reviewerName, reviewText, reviewDate, aiDraftReply, approveUrl, editUrl }
 * @param {number} data.totalNew - Total new reviews today
 * @returns {string} HTML email body
 */
export function buildDailyDigestHtml(data) {
  const { businessName, date, reviews = [], totalNew } = data;

  const total = totalNew !== undefined ? totalNew : reviews.length;
  const negativeCount = reviews.filter((r) => r.rating <= 2).length;
  const positiveCount = reviews.filter((r) => r.rating >= 4).length;
  const neutralCount = total - negativeCount - positiveCount;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f5f7; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .stats-row { display: flex; justify-content: center; gap: 16px; margin: 16px 0; }
    .stat { text-align: center; padding: 12px 16px; border-radius: 8px; min-width: 80px; }
    .stat-value { font-size: 28px; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .stat-negative { background: #fef2f2; } .stat-negative .stat-value { color: #dc2626; }
    .stat-neutral { background: #fffbeb; } .stat-neutral .stat-value { color: #f59e0b; }
    .stat-positive { background: #f0fdf4; } .stat-positive .stat-value { color: #10b981; }
    .review-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0; }
    .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .reviewer-name { font-weight: 600; color: #111827; }
    .stars { color: #f59e0b; font-size: 16px; }
    .review-text { font-size: 14px; color: #374151; line-height: 1.5; margin-bottom: 12px; }
    .draft-preview { background: #f9fafb; border-radius: 6px; padding: 12px; font-size: 14px; color: #6b7280; line-height: 1.4; border-left: 3px solid #10b981; }
    .draft-label { font-size: 11px; font-weight: 600; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .cta-link { display: inline-block; margin-top: 8px; font-size: 13px; color: #10b981; text-decoration: none; font-weight: 600; }
    .cta-link:hover { text-decoration: underline; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    h2 { font-size: 20px; color: #111827; margin: 0; }
    @media (max-width: 480px) { .stats-row { flex-wrap: wrap; } .card { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div style="font-size:13px;color:#10b981;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Daily Review Digest</div>
        <h2>${businessName}</h2>
        <div style="font-size:14px;color:#6b7280;margin-top:4px;">${date} · ${total} new review${total !== 1 ? 's' : ''}</div>
      </div>

      <div class="stats-row">
        <div class="stat stat-negative">
          <div class="stat-value">${negativeCount}</div>
          <div class="stat-label">Negative</div>
        </div>
        <div class="stat stat-neutral">
          <div class="stat-value">${neutralCount}</div>
          <div class="stat-label">Neutral</div>
        </div>
        <div class="stat stat-positive">
          <div class="stat-value">${positiveCount}</div>
          <div class="stat-label">Positive</div>
        </div>
      </div>

      <hr class="divider">

      ${reviews.map((review, i) => buildReviewItem(review, i)).join('')}

      <hr class="divider">

      <div class="footer">
        <p>ReviewPilot — automatically monitors your reviews and drafts replies.<br>
        <a href="#" style="color:#10b981;">View all reviews in dashboard</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildReviewItem(review, index) {
  const { rating, reviewerName, reviewText, aiDraftReply } = review;
  const stars = '★'.repeat(Math.max(0, rating)) + '☆'.repeat(Math.max(0, 5 - rating));
  const borderColor = rating <= 2 ? '#dc2626' : rating === 3 ? '#f59e0b' : '#10b981';

  return `
      <div class="review-item" style="border-left: 4px solid ${borderColor};">
        <div class="review-header">
          <span class="reviewer-name">${escapeHtml(reviewerName || 'Anonymous')}</span>
          <span class="stars">${stars}</span>
        </div>
        <div class="review-text">${escapeHtml(reviewText)}</div>
        ${aiDraftReply ? `
        <div class="draft-preview">
          <div class="draft-label">📝 AI Draft</div>
          ${escapeHtml(aiDraftReply)}
        </div>` : ''}
        <a href="${review.approveUrl || '#'}" class="cta-link">Review &amp; Approve →</a>
      </div>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}