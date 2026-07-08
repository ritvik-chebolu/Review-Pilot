/**
 * openai.js — OpenAI-compatible API integration for ReviewPilot.
 *
 * Supports both OpenAI and DeepSeek (same API shape, different base URL).
 * The `openai` npm package works for both providers.
 *
 * Provider selection:
 *   - DEEPSEEK_API_KEY → https://api.deepseek.com (free tier available)
 *   - OPENAI_API_KEY → https://api.openai.com (fallback)
 */

import OpenAI from 'openai';

const DEBUG = process.env.AI_DEBUG === 'true';

let _client = null;

function getClient() {
  if (!_client) {
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const apiKey = deepseekKey || openaiKey;

    if (!apiKey) {
      throw new Error(
        'No API key found. Set DEEPSEEK_API_KEY (recommended, free) or OPENAI_API_KEY.'
      );
    }

    const baseURL = deepseekKey
      ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com')
      : undefined; // OpenAI default

    _client = new OpenAI({ apiKey, baseURL });

    if (DEBUG) {
      console.log(`[AI] Using ${deepseekKey ? 'DeepSeek' : 'OpenAI'} provider`);
    }
  }
  return _client;
}

/**
 * Determine the default model based on available API key.
 */
function getDefaultModel() {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

/**
 * Generate a review response draft using an OpenAI-compatible API.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [options]
 * @param {number} [options.temperature=0.7]
 * @param {number} [options.maxTokens=300]
 * @param {string} [options.model]
 * @returns {Promise<{response: string, model: string, usage: object|null}>}
 */
export async function generateReply(messages, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 300,
    model = getDefaultModel(),
  } = options;

  if (DEBUG) {
    console.log('[AI] Sending prompt...');
    console.log('[AI] Model:', model);
    console.log('[AI] Messages:', JSON.stringify(messages, null, 2));
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
    console.log('[AI] Response:', response);
    console.log('[AI] Token usage:', usage);
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
 */
function estimateCost(model, usage) {
  if (model === 'gpt-4o-mini') {
    const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15;
    const outputCost = (usage.completion_tokens / 1_000_000) * 0.60;
    return Number((inputCost + outputCost).toFixed(8));
  }
  // DeepSeek-V3 — free tier / extremely cheap
  if (model.startsWith('deepseek')) {
    return 0;
  }
  return null;
}