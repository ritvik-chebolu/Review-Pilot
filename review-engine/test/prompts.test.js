/**
 * prompts.test.js — Unit tests for the prompt builder functions.
 *
 * Run: node --test test/prompts.test.js
 *
 * Note: These tests validate the prompt construction logic only —
 * they do NOT make any API calls.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifySentiment,
  buildSystemPrompt,
  buildReviewPrompt,
  buildMessages,
  buildAnalysisPrompt,
  getNegativeReviewExtension,
  getPositiveReviewExtension,
} from '../lib/prompts.js';

// ─── classifySentiment ───────────────────────────────────────────────────────

describe('classifySentiment', () => {
  it('returns "positive" for ratings 4-5', () => {
    assert.equal(classifySentiment(4), 'positive');
    assert.equal(classifySentiment(5), 'positive');
  });

  it('returns "neutral" for rating 3', () => {
    assert.equal(classifySentiment(3), 'neutral');
  });

  it('returns "negative" for ratings 1-2', () => {
    assert.equal(classifySentiment(1), 'negative');
    assert.equal(classifySentiment(2), 'negative');
  });

  // Note: Ratings from the GBP/Yelp APIs are always 1-5, so no validation needed.
});

// ─── buildSystemPrompt ───────────────────────────────────────────────────────

describe('buildSystemPrompt', () => {
  const baseContext = {
    businessName: 'Downtown Dental',
    businessType: 'dental clinic',
  };

  it('includes business name and type', () => {
    const prompt = buildSystemPrompt(baseContext);
    assert.ok(prompt.includes('Downtown Dental'));
    assert.ok(prompt.includes('dental clinic'));
  });

  it('uses default brand voice when not provided', () => {
    const prompt = buildSystemPrompt(baseContext);
    assert.ok(prompt.includes('professional'));
  });

  it('uses the provided brand voice', () => {
    const prompt = buildSystemPrompt({ ...baseContext, brandVoice: 'casual' });
    assert.ok(prompt.includes('casual'));
  });

  it('signs with "We" by default', () => {
    const prompt = buildSystemPrompt(baseContext);
    assert.ok(prompt.includes('Sign with "We"'));
  });

  it('supports first-person signature', () => {
    const prompt = buildSystemPrompt({
      ...baseContext,
      signatureStyle: 'first-person',
    });
    assert.ok(prompt.includes('Sign with "I"'));
  });

  it('includes avoid topics when provided', () => {
    const prompt = buildSystemPrompt({
      ...baseContext,
      avoidTopics: ['insurance', 'pricing'],
    });
    assert.ok(prompt.includes('insurance'));
    assert.ok(prompt.includes('pricing'));
  });

  it('includes business stats when provided', () => {
    const prompt = buildSystemPrompt({
      ...baseContext,
      totalReviewCount: 127,
      averageRating: 4.5,
    });
    assert.ok(prompt.includes('127'));
    assert.ok(prompt.includes('4.5'));
  });

  it('includes custom instructions when provided', () => {
    const prompt = buildSystemPrompt({
      ...baseContext,
      customInstructions: 'Always mention our 24/7 emergency service.',
    });
    assert.ok(prompt.includes('24/7 emergency service'));
  });
});

// ─── buildReviewPrompt ───────────────────────────────────────────────────────

describe('buildReviewPrompt', () => {
  it('includes rating, reviewer name, and comment', () => {
    const prompt = buildReviewPrompt({
      rating: 4,
      comment: 'Great service!',
      reviewerName: 'Jane',
    });
    assert.ok(prompt.includes('4/5'));
    assert.ok(prompt.includes('Jane'));
    assert.ok(prompt.includes('Great service!'));
  });

  it('uses default name when reviewerName is omitted', () => {
    const prompt = buildReviewPrompt({ rating: 5, comment: 'Amazing!' });
    assert.ok(prompt.includes('a customer'));
  });

  it('includes review date when provided', () => {
    const prompt = buildReviewPrompt({
      rating: 5,
      comment: 'Awesome!',
      reviewDate: '2026-06-28',
    });
    assert.ok(prompt.includes('2026-06-28'));
  });
});

// ─── buildMessages ───────────────────────────────────────────────────────────

describe('buildMessages', () => {
  const business = { name: 'Test Biz', type: 'test type' };

  it('returns messages array and sentiment', () => {
    const result = buildMessages(business, { rating: 5, comment: 'Great!' });
    assert.ok(Array.isArray(result.messages));
    assert.equal(result.messages.length, 2);
    assert.equal(result.messages[0].role, 'system');
    assert.equal(result.messages[1].role, 'user');
    assert.equal(result.sentiment, 'positive');
  });

  it('includes negative extension for 1-star reviews', () => {
    const result = buildMessages(business, {
      rating: 1,
      comment: 'Terrible!',
    });
    const userContent = result.messages[1].content;
    const negExtension = getNegativeReviewExtension();
    assert.ok(userContent.includes('negative review'));
    assert.ok(userContent.includes('Apologize'));
  });

  it('includes positive extension for 5-star reviews', () => {
    const result = buildMessages(business, {
      rating: 5,
      comment: 'Amazing!',
    });
    const userContent = result.messages[1].content;
    const posExtension = getPositiveReviewExtension();
    assert.ok(userContent.includes('positive review'));
    assert.ok(userContent.includes('short'));
  });

  it('omits extensions for 3-star reviews', () => {
    const result = buildMessages(business, {
      rating: 3,
      comment: 'Okay.',
    });
    const userContent = result.messages[1].content;
    const negExt = getNegativeReviewExtension();
    const posExt = getPositiveReviewExtension();
    assert.ok(!userContent.includes(negExt));
    assert.ok(!userContent.includes(posExt));
  });
});

// ─── buildAnalysisPrompt (structured output) ─────────────────────────────────

describe('buildAnalysisPrompt', () => {
  it('returns system + user messages with JSON instructions', () => {
    const messages = buildAnalysisPrompt(
      { rating: 2, comment: 'Bad service.', reviewerName: 'Bob' },
      { businessName: 'Bob\'s Shop', businessType: 'auto repair' }
    );
    assert.equal(messages.length, 2);
    assert.ok(messages[1].content.includes('JSON'));
    assert.ok(messages[1].content.includes('sentiment'));
    assert.ok(messages[1].content.includes('draft_response'));
  });
});