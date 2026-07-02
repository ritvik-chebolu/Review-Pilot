/**
 * index.js — ReviewPilot AI Review Response Engine
 *
 * The main entry point. Provides a unified `generateResponse()` function
 * that automatically routes to the right AI provider and prompt variant
 * based on the review's rating and business context.
 *
 * Usage:
 *   import { generateResponse } from './index.js';
 *
 *   const result = await generateResponse({
 *     review: { rating: 4, comment: 'Great service!', reviewerName: 'Jane' },
 *     business: { name: 'Downtown Dental', type: 'dental clinic', brandVoice: 'warm' },
 *   });
 *
 *   console.log(result.response);
 *
 * Environment variables required (see .env.example):
 *   OPENAI_API_KEY            — needed for primary (OpenAI) provider
 *   ANTHROPIC_API_KEY         — needed for Claude fallback
 *   AI_PRIMARY_PROVIDER       — 'openai' (default) or 'claude'
 *   AI_DEBUG                  — 'true' to log prompts/responses
 */

import { config } from './config.js';
import { buildMessages, classifySentiment } from './lib/prompts.js';
import { generateReply as openaiGenerate } from './lib/openai.js';
import { generateReply as claudeGenerate } from './lib/claude.js';

// ─── Main Public API ─────────────────────────────────────────────────────────

/**
 * Generate a personalized review response using the configured AI provider.
 *
 * @param {object} params
 * @param {object} params.review - The review details
 * @param {number} params.review.rating - Star rating (1-5)
 * @param {string} params.review.comment - Review text
 * @param {string} [params.review.reviewerName] - Reviewer's display name
 * @param {string} [params.review.reviewDate] - Date of the review
 * @param {object} params.business - Business context
 * @param {string} params.business.name - Business name (e.g., "Downtown Dental")
 * @param {string} params.business.type - Business type (e.g., "dental clinic")
 * @param {string} [params.business.brandVoice] - Tone: "professional", "warm", "casual", etc.
 * @param {'first-person'|'we'|'business-name'} [params.business.signatureStyle] - How to sign
 * @param {string} [params.business.customInstructions] - Free-text additional rules
 * @param {string[]} [params.business.avoidTopics] - Topics to avoid mentioning
 * @param {number} [params.business.totalReviewCount] - For context
 * @param {number} [params.business.averageRating] - For context
 * @param {object} [params.options] - Override provider settings
 * @param {'openai'|'claude'} [params.options.provider] - Force a specific provider
 * @param {number} [params.options.temperature]
 * @param {number} [params.options.maxTokens]
 * @returns {Promise<GenerateResult>}
 *
 * @typedef {object} GenerateResult
 * @property {string} response - The generated response text
 * @property {'positive'|'neutral'|'negative'} sentiment - Classified sentiment
 * @property {string} provider - Which provider was used ('openai' | 'claude')
 * @property {string} model - Which model was used
 * @property {object|null} usage - Token usage and cost estimate
 */
export async function generateResponse(params) {
  const { review, business, options = {} } = params;

  // Validate required fields
  if (!review || typeof review.rating !== 'number' || !review.comment) {
    throw new Error('Invalid review: rating (number) and comment (string) are required');
  }
  if (!business || !business.name || !business.type) {
    throw new Error('Invalid business: name and type are required');
  }

  // Build the messages array with the appropriate prompt variant
  const { messages, sentiment } = buildMessages(business, review);

  // Determine which provider to use
  const useProvider = options.provider || config.primaryProvider;
  const isFallback = useProvider !== config.primaryProvider;

  // Decide temperature — use slightly lower for negative reviews (more careful)
  const baseTemperature = isFallback
    ? options.temperature || config.claude.temperature
    : options.temperature || config.openai.temperature;

  // Choose provider
  const provider = useProvider === 'claude' ? 'claude' : 'openai';

  // For negative reviews when using OpenAI, consider Claude as a higher-quality fallback
  // Only if primary is OpenAI, sentiment is negative, and no provider was forced
  const useClaudeFallback =
    provider === 'openai' &&
    sentiment === 'negative' &&
    !options.provider &&
    process.env.ANTHROPIC_API_KEY;

  const finalProvider = useClaudeFallback ? 'claude' : provider;

  let result;
  if (finalProvider === 'claude') {
    const modelOptions = {
      temperature: options.temperature || config.claude.temperature,
      maxTokens: options.maxTokens || config.claude.maxTokens,
      model: config.claude.model,
    };
    result = await claudeGenerate(messages, modelOptions);
  } else {
    const modelOptions = {
      temperature: baseTemperature,
      maxTokens: options.maxTokens || config.openai.maxTokens,
      model: config.openai.model,
    };
    result = await openaiGenerate(messages, modelOptions);
  }

  return {
    response: result.response,
    sentiment,
    provider: finalProvider,
    model: result.model,
    usage: result.usage,
    usedFallback: useClaudeFallback,
  };
}

// ─── Convenience Exports ─────────────────────────────────────────────────────

export { classifySentiment, buildMessages } from './lib/prompts.js';
export { config } from './config.js';