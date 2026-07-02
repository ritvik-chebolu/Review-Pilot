/**
 * config.js — Central configuration for the email engine.
 */

function loadConfig() {
  return {
    /** Resend API key */
    apiKey: process.env.RESEND_API_KEY || '',

    /** From address for all emails */
    from: process.env.EMAIL_FROM || 'reviews@reviewpilot.app',

    /** Debug logging */
    debug: process.env.EMAIL_DEBUG === 'true',

    /** Demo recipient (used by demo.js) */
    demoTo: process.env.DEMO_TO_EMAIL || 'owner@example.com',
  };
}

export const config = loadConfig();