/**
 * templates.test.js — Unit tests for email template builders.
 *
 * Run: npm test   (or: node --test test/templates.test.js)
 *
 * Tests that templates render without errors and contain expected content.
 * No API calls are made.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildNegativeAlertHtml } from '../templates/negative-alert.js';
import { buildDailyDigestHtml } from '../templates/daily-digest.js';
import { buildWeeklySummaryHtml } from '../templates/weekly-summary.js';
import {
  processNewReview,
  buildDailyDigest,
  buildWeeklySummary,
} from '../services/notificationService.js';

// ─── Test Data ───────────────────────────────────────────────────────────────

const baseBusiness = { name: 'Test Biz', type: 'test', email: 'owner@test.com' };

const sampleReview = {
  rating: 2,
  reviewerName: 'Sam T.',
  comment: 'Disappointed with the service.',
  reviewDate: '2026-06-27',
  aiDraftReply: 'Hi Sam, sorry about your experience.',
};

const samplePositiveReview = {
  rating: 5,
  reviewerName: 'Maria G.',
  comment: 'Amazing service!',
  reviewDate: '2026-06-28',
  aiDraftReply: 'Thanks Maria!',
};

// ─── Negative Alert Template ─────────────────────────────────────────────────

describe('negative-alert template', () => {
  it('renders without errors', () => {
    const html = buildNegativeAlertHtml({
      businessName: 'Test Biz',
      rating: 1,
      reviewerName: 'Jane D.',
      reviewText: 'Terrible!',
      reviewDate: '2026-06-28',
      aiDraftReply: 'Hi Jane, sorry.',
      approveUrl: 'https://approve.com',
      editUrl: 'https://edit.com',
    });
    assert.ok(html);
    assert.ok(html.includes('Test Biz'));
    assert.ok(html.includes('Jane D.'));
    assert.ok(html.includes('Terrible!'));
    assert.ok(html.includes('Hi Jane, sorry'));
  });

  it('shows "Urgent" badge for 1-star reviews', () => {
    const html1 = buildNegativeAlertHtml({
      businessName: 'X', rating: 1, reviewerName: 'A',
      reviewText: 'Bad', reviewDate: '', aiDraftReply: '',
    });
    assert.ok(html1.includes('Urgent'));

    const html2 = buildNegativeAlertHtml({
      businessName: 'X', rating: 2, reviewerName: 'A',
      reviewText: 'Bad', reviewDate: '', aiDraftReply: '',
    });
    assert.ok(html2.includes('Attention Needed'));
  });

  it('includes approve and edit CTA buttons', () => {
    const html = buildNegativeAlertHtml({
      businessName: 'X', rating: 2, reviewerName: 'A',
      reviewText: 'Bad', reviewDate: '', aiDraftReply: '',
      approveUrl: 'https://approve.test',
      editUrl: 'https://edit.test',
    });
    assert.ok(html.includes('Approve &amp; Post'));
    assert.ok(html.includes('Edit Before Posting'));
    assert.ok(html.includes('https://approve.test'));
    assert.ok(html.includes('https://edit.test'));
  });

  it('escapes HTML in user input', () => {
    const html = buildNegativeAlertHtml({
      businessName: 'X', rating: 3, reviewerName: '<script>',
      reviewText: '<b>test</b>', reviewDate: '', aiDraftReply: '',
    });
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });
});

// ─── Daily Digest Template ───────────────────────────────────────────────────

describe('daily-digest template', () => {
  it('renders with reviews', () => {
    const html = buildDailyDigestHtml({
      businessName: 'Test Biz',
      date: 'June 28, 2026',
      reviews: [
        { rating: 5, reviewerName: 'Maria', reviewText: 'Great!', aiDraftReply: 'Thanks!', approveUrl: '#', editUrl: '#' },
        { rating: 2, reviewerName: 'Sam', reviewText: 'Bad', aiDraftReply: 'Sorry...', approveUrl: '#', editUrl: '#' },
      ],
      totalNew: 2,
    });
    assert.ok(html.includes('Daily Review Digest'));
    assert.ok(html.includes('Test Biz'));
    assert.ok(html.includes('Maria'));
    assert.ok(html.includes('Sam'));
    assert.ok(html.includes('2 new reviews'));
  });

  it('shows stats breakdown', () => {
    const html = buildDailyDigestHtml({
      businessName: 'X', date: '', reviews: [
        { rating: 5, reviewerName: 'A', reviewText: 'Good', aiDraftReply: '' },
        { rating: 2, reviewerName: 'B', reviewText: 'Bad', aiDraftReply: '' },
      ], totalNew: 2,
    });
    assert.ok(html.includes('Negative'));
    assert.ok(html.includes('Positive'));
    assert.ok(html.includes('Neutral'));
  });
});

// ─── Weekly Summary Template ─────────────────────────────────────────────────

describe('weekly-summary template', () => {
  const weeklyData = {
    businessName: 'Test Biz',
    weekLabel: 'Jun 28 — Jul 4, 2026',
    stats: {
      totalReviews: 127,
      averageRating: 4.2,
      previousAverageRating: 4.0,
      responseRate: 94,
      newReviewsThisWeek: 12,
      negativeCount: 2,
      positiveCount: 9,
      ratingDistribution: [1, 1, 1, 4, 5],
    },
    topReviews: [
      { reviewerName: 'Maria G.', rating: 5, comment: 'Amazing!' },
    ],
    reviewsNeedingResponse: [
      { reviewerName: 'Sam T.', rating: 2, comment: 'Bad service.' },
    ],
    dashboardUrl: 'https://dash.test',
  };

  it('renders without errors', () => {
    const html = buildWeeklySummaryHtml(weeklyData);
    assert.ok(html.includes('Weekly Reputation Summary'));
    assert.ok(html.includes('Test Biz'));
    assert.ok(html.includes('4.2'));
    assert.ok(html.includes('94'));
    assert.ok(html.includes('127'));
  });

  it('shows rating change indicator (up)', () => {
    const html = buildWeeklySummaryHtml({
      ...weeklyData,
      stats: { ...weeklyData.stats, previousAverageRating: 4.0, averageRating: 4.2 },
    });
    assert.ok(html.includes('+0.20'));
  });

  it('shows rating change indicator (down)', () => {
    const html = buildWeeklySummaryHtml({
      ...weeklyData,
      stats: { ...weeklyData.stats, previousAverageRating: 4.5, averageRating: 4.2 },
    });
    assert.ok(html.includes('-0.30'));
  });

  it('shows "All caught up" when no reviews need response', () => {
    const html = buildWeeklySummaryHtml({
      ...weeklyData,
      reviewsNeedingResponse: [],
    });
    assert.ok(html.includes('All caught up'));
  });
});

// ─── Notification Service ────────────────────────────────────────────────────

describe('notificationService', () => {
  describe('processNewReview', () => {
    it('returns negative alert for 1-2 star reviews', () => {
      const notifs = processNewReview(sampleReview, baseBusiness, {
        aiDraftReply: sampleReview.aiDraftReply,
      });
      assert.equal(notifs.length, 1);
      assert.equal(notifs[0].type, 'negative_alert');
      assert.equal(notifs[0].priority, 'high');
    });

    it('returns empty array for positive reviews', () => {
      const notifs = processNewReview(
        { rating: 5, reviewerName: 'Maria', comment: 'Great!' },
        baseBusiness
      );
      assert.equal(notifs.length, 0);
    });

    it('includes aiDraftReply in the HTML when provided', () => {
      const notifs = processNewReview(sampleReview, baseBusiness, {
        aiDraftReply: 'Hi Sam, sorry about your experience.',
      });
      const html = notifs[0].html;
      assert.ok(html.includes('Hi Sam, sorry'));
    });
  });

  describe('buildDailyDigest', () => {
    it('returns null when no reviews', () => {
      const result = buildDailyDigest({
        businessName: 'X', businessEmail: 'x@x.com',
        reviews: [], dateLabel: 'today',
      });
      assert.equal(result, null);
    });

    it('returns daily digest notification with reviews', () => {
      const reviews = [
        { rating: 5, reviewerName: 'Maria', comment: 'Great!', aiDraftReply: 'Thanks!' },
        { rating: 2, reviewerName: 'Sam', comment: 'Bad', aiDraftReply: 'Sorry...' },
      ];
      const result = buildDailyDigest({
        businessName: 'Test Biz', businessEmail: 'owner@test.com',
        reviews, dateLabel: 'June 28',
      });
      assert.ok(result);
      assert.equal(result.type, 'daily_digest');
      assert.ok(result.subject.includes('Test Biz'));
      assert.ok(result.html.includes('Test Biz'));
    });
  });

  describe('buildWeeklySummary', () => {
    it('returns weekly summary notification with stats', () => {
      const result = buildWeeklySummary({
        businessName: 'Test Biz',
        businessEmail: 'owner@test.com',
        weekLabel: 'Week of Jun 28',
        stats: {
          totalReviews: 100,
          averageRating: 4.0,
          previousAverageRating: 3.9,
          responseRate: 90,
          newReviewsThisWeek: 10,
          negativeCount: 1,
          positiveCount: 8,
          ratingDistribution: [0, 0, 1, 3, 6],
        },
        topReviews: [],
        reviewsNeedingResponse: [],
      });
      assert.ok(result);
      assert.equal(result.type, 'weekly_summary');
      assert.ok(result.subject.includes('Test Biz'));
      assert.ok(result.html.includes('Week of Jun 28'));
    });
  });
});