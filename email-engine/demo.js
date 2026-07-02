/**
 * demo.js — Email Engine Demo
 *
 * Shows the three email notification types that ReviewPilot sends.
 * Does NOT require API keys — renders templates to console or saves to files
 * so you can preview the HTML.
 *
 * Run: node demo.js
 * To save HTML files: node demo.js | grep "Writing" | head -3  # shows paths
 *   OR: node demo.js > /dev/null 2>&1 && ls -la /tmp/reviewpilot-email-*.html
 */

import {
  processNewReview,
  buildDailyDigest,
  buildWeeklySummary,
} from './services/notificationService.js';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ─── Demo Data ───────────────────────────────────────────────────────────────

const businessA = {
  name: 'Downtown Dental',
  type: 'dental clinic',
  email: 'dentist@downtowndental.com',
};

const businessB = {
  name: "Bob's Auto Repair",
  type: 'auto repair shop',
  email: 'bob@bobsautorepair.com',
};

const sampleReviews = [
  {
    rating: 1,
    reviewerName: 'Jordan P.',
    comment: 'Terrible! They overcharged me by $200 and when I called to ask about it, the billing person was extremely rude. I will never come back here and I am telling everyone I know to avoid this place.',
    reviewDate: '2026-06-28',
    aiDraftReply: 'Hi Jordan, I am truly sorry about your experience. Overcharging is unacceptable, and I want to personally look into this right away. Please email me directly at bob@bobsautorepair.com so I can review your bill and make it right. Your feedback helps us improve, and I appreciate you bringing this to my attention.',
  },
  {
    rating: 2,
    reviewerName: 'Sam T.',
    comment: 'Disappointed with the service. I called ahead and they said they could take me, but when I arrived they said I needed an appointment and could not help. Wasted my lunch break.',
    reviewDate: '2026-06-27',
    aiDraftReply: 'Hi Sam, I am sorry about the confusion. That is not the experience we want our patients to have. We are reviewing our check-in process to make sure this does not happen again. Please give us a call and we will get you scheduled right away.',
  },
  {
    rating: 3,
    reviewerName: 'Alex R.',
    comment: 'The cleaning was fine, but I felt rushed. They did a good job explaining everything though. Decent place overall.',
    reviewDate: '2026-06-26',
    aiDraftReply: 'Thanks for your honest feedback, Alex. We are glad you appreciated the explanations, and we hear you on the pacing. We will share this with the team to ensure every visit feels thorough and unhurried.',
  },
  {
    rating: 4,
    reviewerName: 'Tom K.',
    comment: 'Great experience overall. Very clean office and professional staff. Only reason not 5 stars is because I had to wait about 15 minutes past my appointment time.',
    reviewDate: '2026-06-25',
    aiDraftReply: 'Thank you, Tom! We are glad you enjoyed your visit and appreciate you noting the cleanliness and our team. We apologize for the wait and are working on tightening our schedule.',
  },
  {
    rating: 5,
    reviewerName: 'Maria G.',
    comment: 'Dr. Chen is absolutely wonderful! She made me feel so comfortable during my cleaning. The front desk staff was super friendly and helpful.',
    reviewDate: '2026-06-24',
    aiDraftReply: 'Thank you so much, Maria! We are thrilled you had a great experience with Dr. Chen. She truly cares about her patients. Looking forward to seeing you again!',
  },
];

// ─── Demo Runner ─────────────────────────────────────────────────────────────

async function runDemo() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║    ReviewPilot — Email Notification Engine (Demo)    ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const hasResendKey = !!process.env.RESEND_API_KEY;
  const outputDir = join(tmpdir(), 'reviewpilot-email-demo');
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  // ─── 1. Negative Review Alert (Immediate) ──────────────────────
  console.log('─'.repeat(58));
  console.log('  📧 TYPE 1: Negative Review Alert (Immediate)');
  console.log('─'.repeat(58));
  console.log('  Trigger: 1-2 star review detected');
  console.log(`  Business: ${businessB.name}`);
  console.log(`  Reviewer: ${sampleReviews[0].reviewerName}`);
  console.log(`  Rating:   1/5 ⭐`);
  console.log();

  const negNotifs = processNewReview(sampleReviews[0], businessB, {
    aiDraftReply: sampleReviews[0].aiDraftReply,
    approveUrl: 'https://app.reviewpilot.app/biz/abc123/reviews/neg1/approve',
    editUrl: 'https://app.reviewpilot.app/biz/abc123/reviews/neg1/edit',
  });

  for (const n of negNotifs) {
    console.log(`  → Subject: ${n.subject}`);
    console.log(`  → To: ${n.to}`);
    const filePath = join(outputDir, '01-negative-alert.html');
    writeFileSync(filePath, n.html);
    console.log(`  → HTML: file://${filePath}`);
  }

  // ─── 2. Daily Digest ───────────────────────────────────────────
  console.log();
  console.log('─'.repeat(58));
  console.log('  📧 TYPE 2: Daily Digest (End of Day)');
  console.log('─'.repeat(58));
  console.log('  Trigger: 5 new reviews accumulated today');
  console.log();

  const digest = buildDailyDigest({
    businessName: businessA.name,
    businessEmail: businessA.email,
    reviews: sampleReviews.map((r) => ({
      ...r,
      reviewText: r.comment,
    })),
    dateLabel: 'June 28, 2026',
  });

  if (digest) {
    console.log(`  → Subject: ${digest.subject}`);
    console.log(`  → To: ${digest.to}`);
    const filePath = join(outputDir, '02-daily-digest.html');
    writeFileSync(filePath, digest.html);
    console.log(`  → HTML: file://${filePath}`);
  }

  // ─── 3. Weekly Reputation Summary ──────────────────────────────
  console.log();
  console.log('─'.repeat(58));
  console.log('  📧 TYPE 3: Weekly Reputation Summary');
  console.log('─'.repeat(58));
  console.log('  Trigger: End of week');
  console.log();

  const summary = buildWeeklySummary({
    businessName: businessA.name,
    businessEmail: businessA.email,
    weekLabel: 'Jun 28 — Jul 4, 2026',
    stats: {
      totalReviews: 127,
      averageRating: 4.2,
      previousAverageRating: 4.1,
      responseRate: 94,
      newReviewsThisWeek: 12,
      negativeCount: 2,
      positiveCount: 9,
      ratingDistribution: [1, 1, 1, 4, 5],
    },
    topReviews: [
      { reviewerName: 'Maria G.', rating: 5, comment: 'Dr. Chen is absolutely wonderful! She made me feel so comfortable.' },
      { reviewerName: 'Tom K.', rating: 4, comment: 'Great experience overall. Very clean office and professional staff.' },
      { reviewerName: 'Lisa W.', rating: 5, comment: 'Best dental visit I have ever had. Highly recommend!' },
    ],
    reviewsNeedingResponse: [
      { reviewerName: 'Sam T.', rating: 2, comment: 'Disappointed with the service...' },
    ],
    dashboardUrl: 'https://app.reviewpilot.app/biz/abc123/dashboard',
  });

  console.log(`  → Subject: ${summary.subject}`);
  console.log(`  → To: ${summary.to}`);
  const filePath = join(outputDir, '03-weekly-summary.html');
  writeFileSync(filePath, summary.html);
  console.log(`  → HTML: file://${filePath}`);

  // ─── Summary ───────────────────────────────────────────────────
  console.log();
  console.log('─'.repeat(58));
  console.log('  ✅ Demo complete!');
  console.log(`  📁 HTML files saved to: ${outputDir}`);
  console.log();

  if (hasResendKey) {
    console.log('  🚀 RESEND_API_KEY detected — you can send real emails:');
    console.log('     node -e "import { sendNegativeAlert } from');
    console.log("       './index.js'; sendNegativeAlert({businessName:'Test',");
    console.log("       ownerEmail:'you@example.com', review:{rating:1,");
    console.log("       reviewerName:'Jane',reviewText:'Bad',");
    console.log("       aiDraftReply:'Sorry...'}}).then(r=>console.log(r))\"");
  } else {
    console.log('  🔑 To send real emails: export RESEND_API_KEY=re_...');
    console.log('  📖 For template details, see the template files in ./templates/');
  }
  console.log();
}

runDemo().catch(console.error);