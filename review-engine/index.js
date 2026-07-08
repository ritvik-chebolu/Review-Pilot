/**
 * index.js — ReviewPilot AI Review Response Engine
 *
 * The main entry point. Provides a unified `generateResponse()` function
 * that automatically routes to the right provider:
 *
 *   1. Template engine (default — no API key required!)
 *   2. DeepSeek API (if DEEPSEEK_API_KEY is set — free tier available)
 *   3. OpenAI API (if OPENAI_API_KEY is set — costs money)
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
 */

import { config } from './config.js';
import { buildMessages, classifySentiment } from './lib/prompts.js';
import { generateTemplateResponse } from './lib/templates.js';

// Lazy-import API providers only when needed
let openaiGenerate = null;
async function getApiGenerator() {
  if (!openaiGenerate) {
    const mod = await import('./lib/openai.js');
    openaiGenerate = mod.generateReply;
  }
  return openaiGenerate;
}

// ─── Main Public API ─────────────────────────────────────────────────────────

/**
 * Generate a personalized review response.
 *
 * @param {object} params
 * @param {object} params.review
 * @param {number} params.review.rating - Star rating (1-5)
 * @param {string} params.review.comment - Review text
 * @param {string} [params.review.reviewerName] - Reviewer's display name
 * @param {string} [params.review.reviewDate] - Date of the review
 * @param {object} params.business
 * @param {string} params.business.name - Business name
 * @param {string} params.business.type - Business type
 * @param {string} [params.business.brandVoice] - Tone
 * @param {'first-person'|'we'|'business-name'} [params.business.signatureStyle]
 * @param {string} [params.business.customInstructions]
 * @param {object} [params.options]
 * @param {'template'|'deepseek'|'openai'} [params.options.provider]
 * @returns {Promise<GenerateResult>}
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

  const sentiment = classifySentiment(review.rating);
  const useProvider = options.provider || config.primaryProvider;

  // ── Template provider (no API key needed) ──────────────────────────────
  if (useProvider === 'template') {
    const templateResult = generateTemplateResponse({
      review: {
        rating: review.rating,
        comment: review.comment,
        reviewerName: review.reviewerName,
      },
      business: {
        name: business.name,
        type: business.type,
        brandVoice: business.brandVoice,
        signatureStyle: business.signatureStyle,
      },
    });

    return {
      response: templateResult.response,
      sentiment: templateResult.sentiment,
      provider: 'template',
      model: 'template-v1',
      usage: null,
      usedFallback: false,
    };
  }

  // ── API-based provider (DeepSeek or OpenAI) ────────────────────────────
  try {
    const generate = await getApiGenerator();
    const { messages } = buildMessages(business, review);

    const providerConfig = useProvider === 'deepseek' ? config.deepseek : config.openai;

    const result = await generate(messages, {
      temperature: options.temperature || providerConfig.temperature,
      maxTokens: options.maxTokens || providerConfig.maxTokens,
      model: providerConfig.model,
    });

    return {
      response: result.response,
      sentiment,
      provider: useProvider,
      model: result.model,
      usage: result.usage,
      usedFallback: false,
    };
  } catch (err) {
    // If API fails, fall back to template engine
    console.warn(`[ReviewEngine] ${useProvider} API failed, falling back to templates:`, err.message);

    const templateResult = generateTemplateResponse({
      review: {
        rating: review.rating,
        comment: review.comment,
        reviewerName: review.reviewerName,
      },
      business: {
        name: business.name,
        type: business.type,
        brandVoice: business.brandVoice,
        signatureStyle: business.signatureStyle,
      },
    });

    return {
      response: templateResult.response,
      sentiment: templateResult.sentiment,
      provider: 'template',
      model: 'template-v1 (fallback)',
      usage: null,
      usedFallback: true,
    };
  }
}

// ─── Convenience Exports ─────────────────────────────────────────────────────

export { classifySentiment, buildMessages } from './lib/prompts.js';
export { generateTemplateResponse } from './lib/templates.js';
export { config } from './config.js';