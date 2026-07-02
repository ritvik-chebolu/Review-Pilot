# ReviewPilot — Integration Research Document

> Compiled: 2026-07-01
> Author: AI Integrations Engineer

## Table of Contents
1. [Google Business Profile API](#1-google-business-profile-api)
2. [Yelp Fusion API](#2-yelp-fusion-api)
3. [AI Response Generation (OpenAI / Claude)](#3-ai-response-generation)
4. [Transactional Email Provider](#4-transactional-email-provider)
5. [Architecture Recommendations](#5-architecture-recommendations)

---

## 1. Google Business Profile API

### API Version
- **v4** (current) — REST API at `https://mybusiness.googleapis.com/v4/`
- Old v1 endpoints also exist for media uploads

### Authentication
- **OAuth 2.0** — requires user consent for a Google Account that manages Business Profiles
- **Scopes needed:**
  - `https://www.googleapis.com/auth/business.manage` (recommended)
  - `https://www.googleapis.com/auth/plus.business.manage` (legacy)
- **Flow:** OAuth 2.0 server-side web flow → get refresh token → use access token for API calls
- Each business owner must grant OAuth consent — ReviewPilot acts on their behalf

### Key Endpoint: Reviews

#### `GET /v4/{parent=accounts/*/locations/*}/reviews`
Returns paginated list of reviews for a verified location.

**Query Parameters:**
| Param | Type | Details |
|-------|------|---------|
| `pageSize` | integer | Max 50 per page |
| `pageToken` | string | Pagination token for next page |
| `orderBy` | string | Sort: `rating`, `rating desc`, `updateTime desc` (default) |

**Response Structure:**
```json
{
  "reviews": [ { "object": "Review" } ],
  "averageRating": 4.2,
  "totalReviewCount": 127,
  "nextPageToken": "token-for-next-page"
}
```

#### `GET /v4/{name=accounts/*/locations/*/reviews/*}`
Fetch a single review by name.

#### `PUT /v4/{name=accounts/*/locations/*/reviews/*}/reply`
Update (create or edit) the reply to a review.

#### `DELETE /v4/{name=accounts/*/locations/*/reviews/*}/reply`
Delete a reply.

### Review Object Structure
```json
{
  "name": "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}",
  "reviewId": "encrypted-unique-id",
  "reviewer": {
    "profilePhotoUrl": "https://...",
    "displayName": "Jane D.",
    "isAnonymous": false
  },
  "starRating": "FOUR",
  "comment": "Great service! They fixed my car quickly.",
  "createTime": "2026-06-15T14:30:00Z",
  "updateTime": "2026-06-15T14:30:00Z",
  "reviewReply": {
    "comment": "Thanks Jane! We appreciate your business.",
    "updateTime": "2026-06-15T16:00:00Z",
    "reviewReplyState": "APPROVED"
  },
  "reviewMediaItems": []
}
```

**StarRating enum:** `STAR_RATING_UNSPECIFIED`, `ONE`, `TWO`, `THREE`, `FOUR`, `FIVE`

**ReviewReply states:** `PENDING`, `REJECTED`, `APPROVED`

### Notification System (Deprecated but Functional)
- **Google Cloud Pub/Sub** integration is available via the `Notifications` resource
- `PUT /v4/{name=accounts/*/notifications}` — sets a Pub/Sub topic for notifications
- Sends notifications for: **new reviews** for locations administered by the account
- ⚠️ Marked as deprecated — but no replacement announced
- **Recommended approach:** Hybrid — set up Pub/Sub for real-time new-review notifications AND run a fallback poller every 30-60 minutes to catch any missed reviews

### Rate Limits
- Default quota: **10,000 requests per day** (can be increased via Google API Console)
- Per 100 seconds: 100 requests for reads
- Per 100 seconds: 10 requests for writes (updateReply)
- Polling every 15-30 minutes per location is well within limits for most use cases

### Gotchas & Important Notes
1. **Location must be verified** — can't fetch reviews for unverified locations
2. **OAuth consent is per Google Account** — each business owner needs to go through the OAuth flow
3. **`reviewReply.comment` max length:** 4096 bytes
4. **Anonymous reviewers** — `reviewer.isAnonymous=true`, `profilePhotoUrl` and `displayName` may be empty
5. **Review replies are moderated** — may be `PENDING` or `REJECTED` with a `policyViolation` reason
6. **No webhook for review replies** — you must poll to see if a reply was approved/rejected
7. **Multi-location accounts** — the `accounts/{accountId}/locations/` resource allows listing all locations

---

## 2. Yelp Fusion API

### API Version
- **v3** (Fusion API) — the current public API
- Base URL: `https://api.yelp.com/v3`

### Authentication
- **API Key** (Bearer token) — simple, no OAuth flow needed
- Each business provides their Yelp API key
- Obtain from: https://www.yelp.com/developers/documentation/v3/authentication
- ⚠️ Yelp restricts the API key to the account that creates it — can't access other businesses' data with a single key
- **Alternative:** Yelp Business Owner API (if available) — but requires business owner authorization

### Key Endpoint: Business Reviews

#### `GET /v3/businesses/{business_id_or_alias}/reviews`

**Authentication:** `Authorization: Bearer {API_KEY}`

**Parameters:**
| Param | Type | Details |
|-------|------|---------|
| `locale` | string | Optional, e.g. `en_US` |

**Response Structure:**
```json
{
  "reviews": [
    {
      "id": "review-id",
      "url": "https://www.yelp.com/biz/...",
      "text": "Amazing tacos!",
      "rating": 5,
      "time_created": "2026-06-10 19:30:00",
      "user": {
        "id": "user-id",
        "profile_url": "https://www.yelp.com/user_details?userid=...",
        "image_url": "https://...",
        "name": "Alex K."
      }
    }
  ],
  "total": 89,
  "possible_languages": ["en"]
}
```

**Important limitations:**
- Returns only **3 reviews** per call (Yelp limits this endpoint to 3 latest)
- Does **NOT** support pagination for reviews
- For more reviews, use the `GET /v3/businesses/{id}` endpoint which includes `review_count` and `rating`
- ⚠️ **No endpoint to reply to reviews via API** — Yelp does NOT expose a public API for posting business replies
- ⚠️ **No webhooks** — must poll

### Rate Limits
- **Default:** 5,000 API calls per day
- **Rate:** 500 calls per hour (burst limit)
- Increased limits require contacting Yelp's partnership team

### Approach for Yelp Review Monitoring
Since there's no reply API, our approach for Yelp is:
1. **Poll** the `/businesses/{id}/reviews` endpoint every 30-60 minutes
2. **Detect new reviews** by comparing with our stored latest review IDs
3. **Draft AI reply** and notify the business owner via email with the drafted text
4. The **business owner manually pastes** the reply on Yelp's website (no API alternative)
5. **Track** whether they responded and follow up

### Gotchas & Important Notes
1. **Only 3 most recent reviews returned** — we need to track review IDs across polls to detect new ones
2. **No reply API** — replies must be done manually on yelp.com/biz
3. **API Key per business** — each business needs their own Yelp API key
4. **No anonymous reviews** — user info always included
5. **Time format:** `YYYY-MM-DD HH:MM:SS` (not ISO 8601)
6. **Business ID** — use the Yelp business alias (e.g., `taco-bell-san-francisco`) or the numeric ID

---

## 3. AI Response Generation

### Recommended Approach: Hybrid OpenAI + Claude
- **Primary:** OpenAI GPT-4o-mini (fast, cost-effective for high volume)
- **Fallback:** Claude 3.5 Haiku (if OpenAI is down, or for more nuanced negative reviews)

### Prompt Engineering Strategy

#### System Prompt Template
```
You are ReviewPilot, an AI assistant that helps local service businesses craft 
personalized responses to customer reviews. You write in the business owner's 
voice — professional, warm, and on-brand.

BUSINESS CONTEXT:
- Business Name: {business_name}
- Business Type: {business_type} (e.g., dental clinic, auto repair, law firm)
- Brand Voice: {brand_voice} (e.g., professional, friendly, casual, family-oriented)

RULES:
1. ALWAYS address specific points mentioned in the review
2. NEVER be generic or template-like
3. For 4-5 star reviews: thank the customer, be warm, mention their specific praise
4. For 3-star reviews: acknowledge the feedback, thank them, offer to address any concerns
5. For 1-2 star reviews: apologize sincerely, acknowledge the specific issue, 
   offer to make it right, invite offline conversation. Keep it professional — never defensive.
6. Maximum 200 words
7. Sign with the business name (not an individual name unless provided)
8. No markdown, no emoji (unless brand voice allows)
```

#### Prompt Input Schema
```
User Review:
Rating: {starRating}/5
Reviewer: {reviewerName}
Review Text: {comment}
Review Date: {createTime}

Recent Context (if any):
- Business has {totalReviewCount} total reviews
- Average rating: {averageRating}
- Previous reply style examples: [attach last 3 approved replies]
```

#### Negative Review Special Handling
For 1-2 star reviews, add these instructions to the prompt:
```
This is a negative review. Follow these steps:
1. Acknowledge the customer's specific complaint
2. Apologize sincerely and take responsibility
3. Explain (briefly) any corrective action or investigation
4. Offer to connect offline (phone/email) to resolve personally
5. Thank them for the feedback — it helps you improve
DO NOT: make excuses, blame the customer, be defensive, or use legal language
```

#### Tone Customization Options
Each business profile should store:
- `brand_voice`: one of [professional, warm, friendly, casual, formal, family-oriented]
- `signature_style`: one of [first-person-singular ("I"), first-person-plural ("We"), business-name]
- `custom_instructions`: free text (e.g., "Always mention our 24/7 support")
- `avoid_topics`: comma-separated (e.g., "pricing, competitors")
- `language_tone_adjectives`: comma-separated (e.g., "grateful, humble, solution-oriented")

### API Integration Details

#### OpenAI
```
POST https://api.openai.com/v1/chat/completions
Headers: Authorization: Bearer {OPENAI_API_KEY}
Body:
{
  "model": "gpt-4o-mini",
  "messages": [system_prompt, user_prompt],
  "temperature": 0.7,
  "max_tokens": 300
}
```
- **Cost:** ~$0.15/1M input tokens, ~$0.60/1M output tokens (gpt-4o-mini)
- **Typical response:** ~100-200 tokens → ~$0.0001 per response
- **50 reviews/day:** ~$0.005/day (negligible)

#### Anthropic Claude
```
POST https://api.anthropic.com/v1/messages
Headers: x-api-key: {CLAUDE_API_KEY}, anthropic-version: 2023-06-01
Body:
{
  "model": "claude-3-5-haiku-latest",
  "messages": [{"role": "user", "content": system + user_prompt}],
  "max_tokens": 300
}
```
- **Cost:** ~$0.80/1M input tokens, ~$4.00/1M output tokens
- **Typical response:** ~100-200 tokens → ~$0.0008 per response
- Use only for negative reviews where more nuance is needed

### Review Sentiment Analysis
We can classify reviews for urgency without a separate API by using:
1. **Star rating heuristic:** 1-2 stars = negative/urgent, 3 stars = neutral, 4-5 = positive
2. **AI sentiment extraction:** in the same API call, ask the model to return a JSON sentiment field:
   ```json
   {
     "sentiment": "positive|neutral|negative",
     "urgency": "low|medium|high",
     "key_themes": ["pricing", "customer service", "quality"],
     "requires_immediate_response": true|false
   }
   ```
3. **Keyword detection** (fast pre-filter): words like "terrible", "scam", "lawsuit" → flag as urgent

---

## 4. Transactional Email Provider

### Recommendation: **Resend** (https://resend.com)
**Why Resend for ReviewPilot:**

| Criteria | Resend | SendGrid | Postmark |
|----------|--------|----------|----------|
| Free tier | 3,000 emails/mo | 100 emails/day | 100 emails/mo |
| Pricing after free | $0.0001/email | $19.95/mo for 50k | $15/mo for 50k |
| SDK quality | Excellent (JS/TS native) | Good | Good |
| Deliverability | Very high | High | Excellent |
| Open/click tracking | Built-in | Built-in | Built-in |
| API simplicity | ✅ Simplest | ❌ Complex | ✅ Simple |
| React Email support | ✅ Native | ❌ No | ❌ No |

**Recommended plan for ReviewPilot:**
- Use **Resend Free** tier during development/beta (3,000 emails/month)
- Upgrade to **Resend Pro** ($20/mo for 50k emails) at scale

### Email Templates Needed
1. **Negative Review Alert** (immediate)
   - Subject: `⚠️ New {starRating}-star review from {reviewerName}`
   - Content: Review text + AI-drafted reply (pending approval)
   - CTA: "Approve & Post" / "Edit Before Posting"
   
2. **New Review Notification** (daily digest)
   - Subject: `📬 New reviews for {businessName} — {date}`
   - Content: List of new reviews + AI-drafted replies
   
3. **Weekly Reputation Summary** (weekly)
   - Subject: `📊 Your weekly reputation report — {businessName}`
   - Content: Total reviews, average rating change, response rate, top reviews

### Implementation with Resend
```javascript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'ReviewPilot <reviews@reviewpilot.app>',
  to: ['owner@business.com'],
  subject: '⚠️ New 1-star review from Jane D.',
  html: '<h2>New Review Alert</h2><p>...</p>'
});
```

---

## 5. Architecture Recommendations

### Data Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  GBP API     │────▶│  Poller/     │────▶│  AI Engine   │
│  (OAuth 2.0) │     │  Webhook     │     │  (OpenAI)    │
└─────────────┘     │  Receiver    │     └──────┬──────┘
                    └──────────────┘            │
┌─────────────┐                                  │
│  Yelp API    │────▶  Same as above  ──────────┘
│  (API Key)  │                                  │
└─────────────┘                                  ▼
                                        ┌──────────────┐
                                        │  Response     │
                                        │  Dispatcher  │
                                        └──────┬───────┘
                                               │
                                    ┌──────────┴──────────┐
                                    ▼                     ▼
                              ┌──────────┐         ┌──────────┐
                              │ GBP API  │         │  Email   │
                              │ (reply)  │         │  Alert   │
                              └──────────┘         │ (manual  │
                                                   │  action  │
                                                   │  for Yelp│
                                                   └──────────┘
```

### Polling Schedule
| Source | Strategy | Interval |
|--------|----------|----------|
| GBP (with Pub/Sub) | Push + poll fallback | Pub/Sub real-time + poll every 30 min |
| GBP (poll only) | Periodic polling | Every 15 min |
| Yelp | Periodic polling | Every 30 min (only 3 reviews returned) |

### Database Schema (Suggested Tables)
```sql
CREATE TABLE integrations (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'google' or 'yelp'
  auth_type TEXT NOT NULL, -- 'oauth2' or 'api_key'
  credentials_encrypted TEXT NOT NULL,
  location_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  platform_review_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  reviewer_name TEXT,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL,
  ai_sentiment TEXT,
  ai_draft_reply TEXT,
  reply_sent BOOLEAN DEFAULT false,
  reply_approved BOOLEAN,
  replied_at TEXT,
  UNIQUE(platform, platform_review_id)
);

CREATE TABLE reply_drafts (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  draft_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, sent
  model_used TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Env Vars Needed
```
# Google Business Profile API
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Yelp Fusion API (one per business, stored in DB)
# No global env var — API keys are per-business

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=  # optional fallback

# Email
RESEND_API_KEY=

# App
DATABASE_URL=
```