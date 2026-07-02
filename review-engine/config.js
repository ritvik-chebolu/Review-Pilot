/**
 * config.js — Central configuration for the review engine.
 *
 * Loads environment variables and exposes them as a typed config object.
 */

function loadConfig() {
  const primaryProvider = process.env.AI_PRIMARY_PROVIDER || 'openai';
  const validProviders = ['openai', 'claude'];

  if (!validProviders.includes(primaryProvider)) {
    throw new Error(
      `Invalid AI_PRIMARY_PROVIDER "${primaryProvider}". ` +
      `Must be one of: ${validProviders.join(', ')}`
    );
  }

  return {
    /** Primary AI provider: 'openai' or 'claude' */
    primaryProvider,

    /** Whether to log detailed prompt/response info */
    debug: process.env.AI_DEBUG === 'true',

    /** Provider-specific config */
    openai: {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: Number(process.env.OPENAI_TEMPERATURE || '0.7'),
      maxTokens: Number(process.env.OPENAI_MAX_TOKENS || '300'),
    },

    claude: {
      model: process.env.CLAUDE_MODEL || 'claude-3-5-haiku-latest',
      temperature: Number(process.env.CLAUDE_TEMPERATURE || '0.7'),
      maxTokens: Number(process.env.CLAUDE_MAX_TOKENS || '300'),
    },
  };
}

export const config = loadConfig();