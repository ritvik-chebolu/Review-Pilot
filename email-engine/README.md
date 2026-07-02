# ReviewPilot — Email Notification Engine

Sends automated email notifications to business owners via Resend.

## Three Email Types

| Type | Trigger | Content |
|------|---------|---------|
| **Negative Review Alert** | Immediate (1-2★ review) | Review text, star rating, AI-drafted reply, Approve/Edit buttons |
| **Daily Digest** | End of day (if new reviews) | All new reviews with AI drafts, stats breakdown (positive/neutral/negative counts) |
| **Weekly Reputation Summary** | End of week | Average rating, trend vs last week, response rate, rating distribution chart, top reviews |

## Quick Start

```bash
# 1. Install
npm install

# 2. Set up env
cp .env.example .env
# Edit RESEND_API_KEY in .env

# 3. Run demo (no API key needed — saves HTML to /tmp)
node demo.js

# 4. Send a real email
export RESEND_API_KEY=re_...
node -e "import { sendNegativeAlert } from './index.js';
  sendNegativeAlert({
    businessName:'Test Biz', ownerEmail:'you@example.com',
    review:{rating:1, reviewerName:'Jane', reviewText:'Bad service',
      aiDraftReply:'Sorry Jane...'}
  }).then(r => console.log(r))"
```

## Module Structure

```
email-engine/
├── index.js                          # Unified entry point with senders
├── config.js                         # Env-based configuration
├── demo.js                           # Demo runner (no API key needed)
├── package.json
├── .env.example
├── README.md
├── templates/
│   ├── negative-alert.js             # Immediate alert HTML template
│   ├── daily-digest.js               # Daily digest HTML template
│   └── weekly-summary.js             # Weekly summary HTML template
├── lib/
│   └── resend.js                     # Resend SDK wrapper (lazy init)
├── services/
│   └── notificationService.js        # Decision logic + notification builder
└── test/
    └── templates.test.js             # 16 unit tests
```

## API

### `sendNegativeAlert({ businessName, ownerEmail, review })`
Sends an immediate alert for 1-2 star reviews.
- `review`: `{ rating, reviewerName, reviewText, aiDraftReply, reviewDate }`
- Auto-generates HTML with Approve/Edit CTA buttons.

### `sendDailyDigest({ businessName, businessEmail, reviews, dateLabel })`
Sends end-of-day digest with all new reviews.

### `sendWeeklySummary({ businessName, businessEmail, weekLabel, stats, ... })`
Sends weekly reputation report with rating trends, response rate, and distribution chart.

## Testing

```bash
npm test
# 16 tests — validates templates render, notification logic, HTML escaping
```

## Rate Limits (Resend Free Tier)
- 3,000 emails/month free
- 1 email per recipient per second recommended