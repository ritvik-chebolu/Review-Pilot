/**
 * weekly-summary.js — HTML template for the weekly reputation summary.
 *
 * Sent weekly with:
 * - Total reviews this week
 * - Average rating change vs previous week
 * - Response rate
 * - Top / worst reviews
 * - Actionable insights
 */

/**
 * Build the weekly reputation summary email HTML.
 *
 * @param {object} data
 * @param {string} data.businessName
 * @param {string} data.weekLabel - e.g. "Jun 28 — Jul 4, 2026"
 * @param {object} data.stats
 * @param {number} data.stats.totalReviews
 * @param {number} data.stats.averageRating
 * @param {number} data.stats.previousAverageRating
 * @param {number} data.stats.responseRate - 0-100 percentage
 * @param {number} data.stats.newReviewsThisWeek
 * @param {number} data.stats.negativeCount
 * @param {number} data.stats.positiveCount
 * @param {Array} data.stats.ratingDistribution - [0,0,0,0,0] for 1-5 star counts
 * @param {Array<object>} data.topReviews - Best reviews (max 3)
 * @param {Array<object>} data.reviewsNeedingResponse - Reviews without reply (max 3)
 * @param {string} [data.dashboardUrl] - Link to full dashboard
 * @returns {string} HTML email body
 */
export function buildWeeklySummaryHtml(data) {
  const {
    businessName,
    weekLabel,
    stats,
    topReviews = [],
    reviewsNeedingResponse = [],
    dashboardUrl = '#',
  } = data;

  const ratingDiff = stats.averageRating - stats.previousAverageRating;
  const ratingDiffDisplay = ratingDiff === 0
    ? 'no change'
    : `${ratingDiff > 0 ? '+' : ''}${ratingDiff.toFixed(2)}`;

  const trendIcon = ratingDiff > 0 ? '📈' : ratingDiff < 0 ? '📉' : '➡️';
  const trendColor = ratingDiff > 0 ? '#10b981' : ratingDiff < 0 ? '#dc2626' : '#6b7280';

  // Build rating distribution bar chart
  const maxCount = Math.max(...stats.ratingDistribution, 1);
  const bars = stats.ratingDistribution.map((count, i) => {
    const pct = (count / maxCount) * 100;
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981'];
    return `
      <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
        <span style="font-size:13px;color:#6b7280;width:20px;text-align:right;">${i + 1}</span>
        <div style="flex:1;background:#f3f4f6;border-radius:4px;height:20px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${colors[i]};border-radius:4px;"></div>
        </div>
        <span style="font-size:13px;color:#374151;width:24px;">${count}</span>
      </div>`;
  }).join('');

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
    .rating-large { font-size: 48px; font-weight: 800; color: #111827; line-height: 1; }
    .rating-change { display: inline-block; margin-top: 4px; font-size: 14px; font-weight: 600; }
    .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-grid { display: flex; justify-content: center; gap: 16px; margin: 20px 0; flex-wrap: wrap; }
    .metric { text-align: center; padding: 12px 20px; border-radius: 8px; background: #f9fafb; min-width: 100px; }
    .metric-value { font-size: 22px; font-weight: 700; color: #111827; }
    .metric-label { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .section-title { font-size: 16px; font-weight: 700; color: #111827; margin: 20px 0 12px; }
    .review-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 8px 0; }
    .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .reviewer-name { font-weight: 600; color: #111827; font-size: 14px; }
    .stars { color: #f59e0b; font-size: 14px; }
    .review-text { font-size: 13px; color: #6b7280; line-height: 1.4; }
    .cta-btn { display: block; text-align: center; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; background-color: #10b981; color: #ffffff; margin: 20px 0; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af; }
    h2 { font-size: 20px; color: #111827; margin: 0; }
    @media (max-width: 480px) { .metric-grid { flex-direction: column; align-items: center; } .card { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div style="font-size:13px;color:#10b981;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Weekly Reputation Summary</div>
        <h2>${businessName}</h2>
        <div style="font-size:14px;color:#6b7280;margin-top:4px;">${weekLabel}</div>
      </div>

      <div style="text-align:center;margin:20px 0;">
        <div class="rating-large">${stats.averageRating.toFixed(1)}</div>
        <div style="font-size:18px;color:#f59e0b;letter-spacing:4px;">${'★'.repeat(Math.round(stats.averageRating))}${'☆'.repeat(5 - Math.round(stats.averageRating))}</div>
        <div class="rating-change" style="color:${trendColor};">${trendIcon} ${ratingDiffDisplay} from last week</div>
      </div>

      <div class="metric-grid">
        <div class="metric">
          <div class="metric-value">${stats.newReviewsThisWeek}</div>
          <div class="metric-label">New Reviews</div>
        </div>
        <div class="metric">
          <div class="metric-value">${stats.responseRate}%</div>
          <div class="metric-label">Response Rate</div>
        </div>
        <div class="metric">
          <div class="metric-value">${stats.totalReviews}</div>
          <div class="metric-label">Total Reviews</div>
        </div>
      </div>

      <hr class="divider">

      <div class="section-title">Rating Distribution</div>
      ${bars}

      <hr class="divider">

      ${topReviews.length > 0 ? `
        <div class="section-title">⭐ Top Reviews This Week</div>
        ${topReviews.slice(0, 3).map((r) => `
          <div class="review-item">
            <div class="review-header">
              <span class="reviewer-name">${escapeHtml(r.reviewerName)}</span>
              <span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
            <div class="review-text">${escapeHtml(r.comment)}</div>
          </div>
        `).join('')}
        <hr class="divider">
      ` : ''}

      ${reviewsNeedingResponse.length > 0 ? `
        <div class="section-title">⚠️ Reviews Needing Your Response</div>
        ${reviewsNeedingResponse.slice(0, 3).map((r) => `
          <div class="review-item">
            <div class="review-header">
              <span class="reviewer-name">${escapeHtml(r.reviewerName)}</span>
              <span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
            <div class="review-text">${escapeHtml(r.comment)}</div>
          </div>
        `).join('')}
      ` : `
        <div class="section-title">✅ All caught up!</div>
        <div style="font-size:14px;color:#6b7280;">You've responded to all reviews this week. Great job!</div>
      `}

      <a href="${dashboardUrl}" class="cta-btn">View Full Dashboard →</a>

      <hr class="divider">

      <div class="footer">
        <p>ReviewPilot — AI-powered review management for local service businesses.<br>
        <a href="#" style="color:#10b981;">Notification settings</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
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