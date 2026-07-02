/**
 * negative-alert.js — HTML template for immediate negative review alerts.
 *
 * Triggered when a 1-2 star review is detected. Shows:
 * - Review text, star rating, reviewer name
 * - AI-drafted reply (pending approval)
 * - CTA buttons: Approve & Post / Edit Before Posting
 */

/**
 * Build the negative review alert email HTML.
 *
 * @param {object} data
 * @param {string} data.businessName
 * @param {number} data.rating - 1-5
 * @param {string} data.reviewerName
 * @param {string} data.reviewText
 * @param {string} data.reviewDate
 * @param {string} data.aiDraftReply
 * @param {string} [data.approveUrl] - Link to approve the reply
 * @param {string} [data.editUrl] - Link to edit the reply
 * @returns {string} HTML email body
 */
export function buildNegativeAlertHtml(data) {
  const {
    businessName,
    rating,
    reviewerName,
    reviewText,
    reviewDate,
    aiDraftReply,
    approveUrl = '#',
    editUrl = '#',
  } = data;

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const urgencyLabel = rating <= 1 ? 'Urgent' : 'Attention Needed';
  const urgencyColor = rating <= 1 ? '#dc2626' : '#f59e0b';

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
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; color: #fff; background-color: ${urgencyColor}; text-transform: uppercase; letter-spacing: 0.5px; }
    .stars { font-size: 24px; color: #f59e0b; margin: 12px 0; letter-spacing: 2px; }
    .rating-text { font-size: 14px; color: #6b7280; text-align: center; }
    .review-box { background: #f9fafb; border-left: 4px solid ${urgencyColor}; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .reviewer { font-weight: 600; color: #111827; margin-bottom: 4px; }
    .review-date { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }
    .review-text { font-size: 15px; color: #374151; line-height: 1.5; }
    .draft-box { background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .draft-label { font-size: 13px; font-weight: 600; color: #059669; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .draft-text { font-size: 15px; color: #374151; line-height: 1.5; font-style: italic; }
    .cta-row { display: flex; gap: 12px; margin-top: 24px; }
    .cta-primary { flex: 1; display: block; text-align: center; padding: 14px 20px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; background-color: #10b981; color: #ffffff; }
    .cta-secondary { flex: 1; display: block; text-align: center; padding: 14px 20px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; background-color: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    @media (max-width: 480px) { .cta-row { flex-direction: column; } .card { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="badge">${urgencyLabel}</div>
        <div style="font-size:18px;font-weight:700;color:#111827;margin-top:8px;">${businessName}</div>
        <div class="stars">${stars}</div>
        <div class="rating-text">${rating}/5 · ${reviewDate}</div>
      </div>

      <hr class="divider">

      <div class="review-box">
        <div class="reviewer">${escapeHtml(reviewerName)}</div>
        <div class="review-text">${escapeHtml(reviewText)}</div>
      </div>

      <div class="draft-box">
        <div class="draft-label">AI-Drafted Reply</div>
        <div class="draft-text">${escapeHtml(aiDraftReply)}</div>
      </div>

      <div class="cta-row">
        <a href="${approveUrl}" class="cta-primary">✓ Approve &amp; Post</a>
        <a href="${editUrl}" class="cta-secondary">✎ Edit Before Posting</a>
      </div>

      <hr class="divider">

      <div class="footer">
        <p>ReviewPilot — automatically monitors your reviews and drafts replies.<br>
        <a href="#" style="color:#10b981;">Manage notification preferences</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Simple HTML entity escape.
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}