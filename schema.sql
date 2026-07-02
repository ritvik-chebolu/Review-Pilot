-- ReviewPilot Database Schema
-- SQLite (synced via Turso)
-- Date: 2026-07-01

-- ============================================================
-- 1. users — everyone who signs up for ReviewPilot
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id                  TEXT PRIMARY KEY,           -- UUID v4
    email               TEXT NOT NULL UNIQUE,        -- login identifier
    name                TEXT NOT NULL DEFAULT '',    -- display name
    password_hash       TEXT NOT NULL DEFAULT '',    -- bcrypt hash
    stripe_customer_id  TEXT,                       -- Stripe customer reference
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 2. businesses — each business a user manages
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
    id                  TEXT PRIMARY KEY,            -- UUID v4
    user_id             TEXT NOT NULL,               -- FK → users.id
    business_name       TEXT NOT NULL,
    business_type       TEXT NOT NULL DEFAULT '',    -- auto, dental, plumbing, hvac, therapist, law, etc.
    location            TEXT NOT NULL DEFAULT '',    -- city, state or full address
    brand_voice         TEXT NOT NULL DEFAULT 'professional',  -- professional, warm, casual, family-oriented, formal
    signature_style     TEXT NOT NULL DEFAULT 'business-name', -- business-name, first-person, we
    custom_instructions TEXT NOT NULL DEFAULT '',    -- free-form AI response instructions
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- 3. connected_accounts — OAuth-linked Google / Yelp accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS connected_accounts (
    id                  TEXT PRIMARY KEY,           -- UUID v4
    business_id         TEXT NOT NULL,              -- FK → businesses.id
    platform            TEXT NOT NULL CHECK (platform IN ('google', 'yelp')),
    platform_business_id TEXT NOT NULL,             -- the ID on Google/Yelp
    auth_token          TEXT,                       -- encrypted OAuth access token
    refresh_token       TEXT,                       -- encrypted OAuth refresh token (if applicable)
    token_expires_at    TEXT,                       -- ISO 8601 timestamp
    is_active           INTEGER NOT NULL DEFAULT 1, -- 1 = active, 0 = disconnected
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- ============================================================
-- 4. reviews — individual reviews pulled from Google / Yelp
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id              TEXT PRIMARY KEY,               -- UUID v4
    business_id     TEXT NOT NULL,                  -- FK → businesses.id
    platform        TEXT NOT NULL CHECK (platform IN ('google', 'yelp')),
    platform_review_id TEXT,                        -- unique ID from the platform
    reviewer_name   TEXT NOT NULL DEFAULT '',
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text            TEXT NOT NULL DEFAULT '',
    posted_at       TEXT NOT NULL,                  -- ISO 8601: when the review was published on the platform
    responded_at    TEXT,                           -- ISO 8601: when we posted a reply
    response_text   TEXT,                           -- the reply we sent (or AI-drafted)
    sentiment       TEXT NOT NULL DEFAULT 'neutral'
                    CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    is_flagged      INTEGER NOT NULL DEFAULT 0,     -- 1 = flagged for urgent human review
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- reviews: indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_platform ON reviews(platform);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews(sentiment);
CREATE INDEX IF NOT EXISTS idx_reviews_posted_at ON reviews(posted_at);
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON reviews(is_flagged) WHERE is_flagged = 1;

-- ============================================================
-- 5. subscriptions — Stripe subscription tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id                  TEXT PRIMARY KEY,           -- UUID v4
    user_id             TEXT NOT NULL,              -- FK → users.id
    plan                TEXT NOT NULL CHECK (plan IN ('starter', 'growth', 'pro')),
    stripe_subscription_id TEXT,                    -- Stripe subscription reference
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing', 'unpaid')),
    current_period_start TEXT,                      -- ISO 8601
    current_period_end   TEXT,                      -- ISO 8601
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- subscriptions: indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);