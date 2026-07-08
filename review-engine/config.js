/**
 * config.js — Central configuration for the review engine.
 *
 * Loads environment variables and exposes them as a typed config object.
 *
 * Provider strategy:
 *   1. If DEEPSEEK_API_KEY is set → use DeepSeek (OpenAI-compatible, cheap/free)
 *   2. If OPENAI_API_KEY is set → use OpenAI as fallback
 *   3. Otherwise → use built-in template engine (no API key needed!)
 */

function loadConfig() {
  // Auto-detect the best available provider
  let primaryProvider = process.env.AI_PRIMARY_PROVIDER || 'auto';

  if (primaryProvider === 'auto') {
    if (process.env.DEEPSEEK_API_KEY) {
      primaryProvider = 'deepseek';
    } else if (process.env.OPENAI_API_KEY) {
      primaryProvider = 'openai';
    } else {
      primaryProvider = 'template';
    }
  }

  const validProviders = ['deepseek', 'openai', 'claude', 'template'];
  if (!validProviders.includes(primaryProvider)) {
    throw new Error(
      `Invalid AI_PRIMARY_PROVIDER "${primaryProvider}". ` +
      `Must be one of: ${validProviders.join(', ')}`
    );
  }

  return {
    /** Primary AI provider */
    primaryProvider,

    /** Whether we have any API-based provider available */
    hasApiProvider: primaryProvider !== 'template',

    /** Whether to log detailed prompt/response info */
    debug: process.env.AI_DEBUG === 'true',

    /** DeepSeek config (OpenAI-compatible API) */
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      temperature: Number(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
      maxTokens: Number(process.env.DEEPSEEK_MAX_TOKENS || '300'),
    },

    /** OpenAI config (fallback if someone has an existing key) */
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: Number(process.env.OPENAI_TEMPERATURE || '0.7'),
      maxTokens: Number(process.env.OPENAI_MAX_TOKENS || '300'),
    },

    /** Claude config (disabled by default — costs money) */
    claude: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.CLAUDE_MODEL || 'claude-3-5-haiku-latest',
      temperature: Number(process.env.CLAUDE_TEMPERATURE || '0.7'),
      maxTokens: Number(process.env.CLAUDE_MAX_TOKENS || '300'),
    },
  };
}

export const config = loadConfig();