/**
 * openai.js — OpenAI integration for ReviewPilot.
 *
 * Wraps the OpenAI SDK with ReviewPilot's specific needs:
 * - gpt-4o-mini as the primary model (fast, cost-effective)
 * - Configurable temperature and max tokens
 * - Error handling and logging
 *
 * Assumes process.env.OPENAI_API_KEY is set.
 */

import OpenAI from 'openai';

const DEBUG = process.env.AI_DEBUG === 'true';

/**
 * Lazily-initialized OpenAI client.
 * Only created when `generateReply` is first called, so the import
 * doesn't throw when OPENAI_API_KEY is not set.
 */
let _openai = null;
function getClient() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        'OPENAI_API_KEY is not set. Set it in your environment or .env file.'
      );
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

/**
 * Generate a review response draft using OpenAI.
 *
 * @param {Array<{role: string, content: string}>} messages - messages array from buildMessages()
 * @param {object} [options]
 * @param {number} [options.temperature=0.7] - Lower = more deterministic, higher = more creative
 * @param {number} [options.maxTokens=300] - Maximum response length
 * @param {string} [options.model='gpt-4o-mini'] - OpenAI model ID
 * @returns {Promise<{response: string, model: string, usage: object|null}>}
 */
export async function generateReply(messages, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 300,
    model = 'gpt-4o-mini',
  } = options;

  if (DEBUG) {
    console.log('[OpenAI] Sending prompt...');
    console.log('[OpenAI] Model:', model);
    console.log('[OpenAI] Messages:', JSON.stringify(messages, null, 2));
  }

  const client = getClient();
  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  const response = completion.choices[0]?.message?.content?.trim() || '';
  const usage = completion.usage || null;

  if (DEBUG) {
    console.log('[OpenAI] Response:', response);
    console.log('[OpenAI] Token usage:', usage);
  }

  return {
    response,
    model,
    usage: usage
      ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          estimatedCostUsd: estimateCost(model, usage),
        }
      : null,
  };
}

/**
 * Estimate the cost of an API call.
 * Based on GPT-4o-mini pricing: $0.15/1M input tokens, $0.60/1M output tokens.
 */
function estimateCost(model, usage) {
  if (model === 'gpt-4o-mini') {
    const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15;
    const outputCost = (usage.completion_tokens / 1_000_000) * 0.60;
    return Number((inputCost + outputCost).toFixed(8));
  }
  return null; // unknown model pricing
}