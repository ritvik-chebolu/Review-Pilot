/**
 * claude.js — Anthropic Claude integration for ReviewPilot.
 *
 * Used as a fallback for negative / high-urgency reviews where
 * more nuanced, empathetic responses are needed.
 *
 * Assumes process.env.ANTHROPIC_API_KEY is set.
 */

import Anthropic from '@anthropic-ai/sdk';

const DEBUG = process.env.AI_DEBUG === 'true';

/**
 * Lazily-initialized Anthropic client.
 * Only created when `generateReply` is first called, so the import
 * doesn't throw when ANTHROPIC_API_KEY is not set.
 */
let _anthropic = null;
function getClient() {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Set it in your environment or .env file.'
      );
    }
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

/**
 * Generate a review response draft using Claude.
 *
 * Claude's API uses a slightly different message format than OpenAI.
 * This adapter converts our standard messages array.
 *
 * @param {Array<{role: string, content: string}>} messages - messages from buildMessages()
 *   The system prompt is expected to be the first message with role 'system'.
 * @param {object} [options]
 * @param {number} [options.temperature=0.7]
 * @param {number} [options.maxTokens=300]
 * @param {string} [options.model='claude-3-5-haiku-latest']
 * @returns {Promise<{response: string, model: string, usage: object|null}>}
 */
export async function generateReply(messages, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 300,
    model = 'claude-3-5-haiku-latest',
  } = options;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Set it in your environment or .env file.'
    );
  }

  // Claude separates system prompt — extract it from the messages array
  let systemPrompt = '';
  const userMessages = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt += msg.content + '\n';
    } else {
      userMessages.push({ role: msg.role, content: msg.content });
    }
  }

  // Ensure we have at least one user message
  const finalMessages = userMessages.length > 0
    ? userMessages
    : [{ role: 'user', content: 'Generate a review response.' }];

  if (DEBUG) {
    console.log('[Claude] Sending prompt...');
    console.log('[Claude] Model:', model);
    console.log('[Claude] System:', systemPrompt.slice(0, 200) + '...');
    console.log('[Claude] Messages:', JSON.stringify(finalMessages, null, 2));
  }

  const client = getClient();
  const response = await client.messages.create({
    model,
    system: systemPrompt.trim() || undefined,
    messages: finalMessages,
    temperature,
    max_tokens: maxTokens,
  });

  const replyText = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  const usage = response.usage || null;

  if (DEBUG) {
    console.log('[Claude] Response:', replyText);
    console.log('[Claude] Usage:', usage);
  }

  return {
    response: replyText,
    model,
    usage: usage
      ? {
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          estimatedCostUsd: estimateCost(model, usage),
        }
      : null,
  };
}

/**
 * Estimate cost for Claude API calls.
 * Claude 3.5 Haiku: $0.80/1M input tokens, $4.00/1M output tokens.
 */
function estimateCost(model, usage) {
  if (model.startsWith('claude-3-5-haiku')) {
    const inputCost = (usage.input_tokens / 1_000_000) * 0.80;
    const outputCost = (usage.output_tokens / 1_000_000) * 4.00;
    return Number((inputCost + outputCost).toFixed(8));
  }
  return null;
}