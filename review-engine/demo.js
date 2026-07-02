/**
 * demo.js — ReviewPilot Review Engine Demo
 *
 * Run with: node demo.js
 *
 * Shows how the engine works with example reviews across different
 * sentiments. Requires API keys to actually call the AI — but the
 * structure and prompt flow are visible without them.
 *
 * Set up your .env file (see .env.example), or set env vars directly:
 *   export OPENAI_API_KEY=sk-...
 *   node demo.js
 */

import { generateResponse, classifySentiment } from './index.js';

// ─── Demo Data ───────────────────────────────────────────────────────────────

const demoBusiness = {
  name: 'Downtown Dental',
  type: 'dental clinic',
  brandVoice: 'warm',
  signatureStyle: 'we',
  totalReviewCount: 127,
  averageRating: 4.5,
  customInstructions: '',
  avoidTopics: ['insurance', 'pricing'],
};

const exampleReviews = [
  {
    label: '⭐ 5-Star Positive',
    review: {
      rating: 5,
      comment:
        'Dr. Chen is absolutely wonderful! She made me feel so comfortable during my cleaning. The front desk staff was super friendly and helpful with scheduling my next appointment.',
      reviewerName: 'Maria G.',
      reviewDate: '2026-06-28',
    },
  },
  {
    label: '⭐⭐⭐⭐ 4-Star Positive',
    review: {
      rating: 4,
      comment:
        'Great experience overall. Very clean office and professional staff. Only reason not 5 stars is because I had to wait about 15 minutes past my appointment time.',
      reviewerName: 'Tom K.',
      reviewDate: '2026-06-25',
    },
  },
  {
    label: '⭐⭐⭐ 3-Star Neutral',
    review: {
      rating: 3,
      comment:
        'The cleaning was fine, but I felt rushed. They did a good job explaining everything though. Decent place overall.',
      reviewerName: 'Alex R.',
      reviewDate: '2026-06-20',
    },
  },
  {
    label: '⭐⭐ 2-Star Negative',
    review: {
      rating: 2,
      comment:
        'Disappointed with the service. I called ahead and they said they could take me, but when I arrived they said I needed an appointment and couldn\'t help. Wasted my lunch break.',
      reviewerName: 'Sam T.',
      reviewDate: '2026-06-18',
    },
  },
  {
    label: '⭐ 1-Star Negative (Urgent)',
    review: {
      rating: 1,
      comment:
        'Terrible! They overcharged me by $200 and when I called to ask about it, the billing person was extremely rude. I will never come back here and I\'m telling everyone I know to avoid this place.',
      reviewerName: 'Jordan P.',
      reviewDate: '2026-06-15',
    },
  },
];

// ─── Demo Runner ─────────────────────────────────────────────────────────────

async function runDemo() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║        ReviewPilot — AI Review Response Engine       ║');
  console.log('║                    DEMO MODE                         ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Check if API keys are available
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;

  if (!hasOpenAI && !hasClaude) {
    console.log(
      '⚠️  No API keys detected. Set OPENAI_API_KEY or ANTHROPIC_API_KEY\n' +
      '   to see actual AI-generated responses.\n'
    );
    console.log('Showing prompt structure for each review instead:\n');
  }

  for (const { label, review } of exampleReviews) {
    console.log('─'.repeat(58));
    console.log(`  ${label}`);
    console.log('─'.repeat(58));
    console.log(`  Rating:    ${'⭐'.repeat(review.rating)} (${review.rating}/5)`);
    console.log(`  Reviewer:  ${review.reviewerName}`);
    console.log(`  Review:    "${review.comment}"`);
    console.log();

    const sentiment = classifySentiment(review.rating);
    console.log(`  → Sentiment: ${sentiment}`);
    console.log(`  → Provider:  ${sentiment === 'negative' && hasClaude ? 'Claude (fallback)' : 'OpenAI'}`);

    if (hasOpenAI || hasClaude) {
      try {
        const result = await generateResponse({
          review,
          business: demoBusiness,
        });
        console.log(`\n  ✅ Response (${result.provider} / ${result.model}):`);
        console.log(`  ─────────────────────────────────────────`);
        console.log(`  "${result.response}"`);
        if (result.usage) {
          console.log(`\n  📊 Token usage:`, JSON.stringify(result.usage));
        }
      } catch (err) {
        console.log(`\n  ❌ Error: ${err.message}`);
        if (err.status === 401) {
          console.log('  → Check your API key — it may be invalid.');
        }
      }
    } else {
      // Show the prompt structure that would be sent
      console.log(`\n  📝 Prompt structure (visible when API keys are set):`);
      console.log(`  · System: Role + business context + rules`);
      console.log(`  · User: Review details + rating-specific instructions`);
      if (sentiment === 'negative') {
        console.log(`  · Extension: Empathetic + solution-oriented instructions`);
      } else if (sentiment === 'positive') {
        console.log(`  · Extension: Short + warm instructions`);
      }
    }
    console.log();
  }

  console.log('─'.repeat(58));
  console.log('\n📖 For full prompt template details, see prompts.md');
  console.log('📦 To install dependencies:  npm install');
  console.log('🔑 To run with AI:           export OPENAI_API_KEY=sk-... && node demo.js\n');
}

runDemo().catch(console.error);