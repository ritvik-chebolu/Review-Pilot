/**
 * templates.js — Smart template-based review response generator.
 *
 * Generates personalized, natural-sounding review responses WITHOUT
 * any external API. Works by:
 *   1. Classifying the review sentiment (positive/neutral/negative)
 *   2. Extracting key phrases from the review text
 *   3. Selecting and combining template fragments
 *   4. Personalizing with business name, reviewer name, and brand voice
 *
 * This is the DEFAULT response generator — no API keys required.
 * If DEEPSEEK_API_KEY is set, the AI provider will be used instead
 * for higher-quality responses.
 */

// ─── Keyword Extraction ──────────────────────────────────────────────────────

const POSITIVE_PHRASES = [
  'great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'awesome',
  'outstanding', 'perfect', 'incredible', 'superb', 'fabulous', 'stellar',
  'best', 'love', 'loved', 'friendly', 'professional', 'clean', 'spotless',
  'quick', 'fast', 'efficient', 'helpful', 'kind', 'knowledgeable', 'recommend',
  'highly recommend', 'top notch', 'above and beyond', 'impressed', 'thorough',
  'comfortable', 'welcoming', 'pleasant', 'smooth', 'easy', 'convenient',
  'affordable', 'fair', 'honest', 'trustworthy', 'reliable', 'responsive',
  'beautiful', 'skillful', 'expert', 'caring', 'attentive', 'patient',
];

const NEGATIVE_PHRASES = [
  'terrible', 'horrible', 'awful', 'worst', 'rude', 'unprofessional',
  'dirty', 'slow', 'expensive', 'overpriced', 'disappointing', 'disappointed',
  'unacceptable', 'poor', 'bad', 'wait', 'waited', 'waiting', 'ignored',
  'cold', 'broken', 'wrong', 'mistake', 'never again', 'waste', 'scam',
  'charged', 'overcharged', 'unhelpful', 'disrespectful', 'rushed', 'late',
  'cancelled', 'canceled', 'no-show', 'noisy', 'uncomfortable', 'unsafe',
];

const TOPIC_KEYWORDS = {
  service: ['service', 'staff', 'team', 'employee', 'worker', 'personnel', 'crew'],
  quality: ['quality', 'work', 'job', 'result', 'outcome', 'craftsmanship'],
  pricing: ['price', 'pricing', 'cost', 'expensive', 'affordable', 'cheap', 'charge', 'bill', 'invoice', 'fee', 'rate'],
  wait: ['wait', 'waited', 'waiting', 'slow', 'late', 'time', 'delay', 'hour', 'long'],
  cleanliness: ['clean', 'dirty', 'spotless', 'mess', 'tidy', 'hygiene', 'sanitary', 'neat'],
  communication: ['call', 'called', 'email', 'respond', 'response', 'communication', 'explain', 'explained', 'told', 'informed'],
  location: ['location', 'office', 'shop', 'store', 'building', 'parking', 'convenient'],
  food: ['food', 'meal', 'dish', 'taste', 'flavor', 'menu', 'portion', 'fresh', 'delicious', 'cold'],
  professionalism: ['professional', 'professionalism', 'knowledgeable', 'expert', 'skilled', 'experienced'],
};

/**
 * Extract dominant topics from review text.
 */
function extractTopics(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.push(topic);
    }
  }
  return found.length > 0 ? found : ['service'];
}

/**
 * Extract specific compliments or complaints from review text.
 */
function extractKeyPhrases(text, sentiment) {
  const lower = text.toLowerCase();
  const wordList = sentiment === 'negative' ? NEGATIVE_PHRASES : POSITIVE_PHRASES;
  return wordList.filter((phrase) => lower.includes(phrase)).slice(0, 3);
}

/**
 * Pick a random element from an array.
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Template Fragments ──────────────────────────────────────────────────────

const POSITIVE_OPENERS = [
  (name) => `Thank you so much for the wonderful review, ${name}!`,
  (name) => `${name}, thank you for taking the time to share your experience!`,
  (name) => `We really appreciate your kind words, ${name}!`,
  (name) => `Thank you for the fantastic feedback, ${name}!`,
  (name) => `${name}, what a lovely review — thank you!`,
  (name) => `We're so grateful for your thoughtful review, ${name}!`,
];

const POSITIVE_MIDDLES = {
  service: [
    'We take pride in providing the best service possible, and hearing that from you means the world.',
    "It's wonderful to know our team made a positive impression.",
    'Our team works hard every day to deliver a great experience, so this means a lot.',
  ],
  quality: [
    'Quality is at the heart of everything we do, and we\'re glad it shows.',
    'We always strive for the highest standard, and your feedback confirms we\'re on the right track.',
  ],
  pricing: [
    'We believe in offering fair, transparent pricing and are glad you agree.',
    'Providing great value is something we\'re passionate about.',
  ],
  cleanliness: [
    'We take cleanliness very seriously, so we\'re glad you noticed!',
    'Maintaining a spotless environment is a top priority for us.',
  ],
  professionalism: [
    'Professionalism is a cornerstone of our approach, and we appreciate you recognizing it.',
    'Our team strives to be both knowledgeable and approachable.',
  ],
  communication: [
    'Clear communication is something we prioritize with every customer.',
    'We always want our customers to feel well-informed and taken care of.',
  ],
  wait: [
    'We understand your time is valuable and strive to be as efficient as possible.',
  ],
  food: [
    'We\'re so happy you enjoyed the food! Our team puts a lot of love into every dish.',
    'Knowing our food hit the spot makes our day!',
  ],
  location: [
    'We\'re glad you found our location convenient!',
  ],
};

const POSITIVE_CLOSERS = {
  'professional': [
    'We look forward to serving you again.',
    'Thank you for choosing us — we value your continued trust.',
  ],
  'warm': [
    'We can\'t wait to welcome you back!',
    'Looking forward to seeing you again soon!',
    'You\'re always welcome here!',
  ],
  'casual': [
    'See you next time!',
    'Come back anytime!',
    'Catch you soon!',
  ],
  'family-oriented': [
    'You and your family are always welcome here!',
    'We look forward to seeing you and your family again soon!',
  ],
  'formal': [
    'We appreciate your patronage and look forward to serving you in the future.',
    'Thank you for entrusting us with your needs.',
  ],
};

const NEUTRAL_OPENERS = [
  (name) => `Thank you for your feedback, ${name}.`,
  (name) => `${name}, we appreciate you taking the time to share your thoughts.`,
  (name) => `Thank you for your honest review, ${name}.`,
];

const NEUTRAL_MIDDLES = [
  'We value all feedback as it helps us continue improving.',
  'Your input helps us understand where we can do better.',
  'We\'re always looking for ways to improve, and your perspective is helpful.',
  'We appreciate constructive feedback — it makes us better.',
];

const NEUTRAL_CLOSERS = [
  'If there\'s anything specific we can do to improve your next experience, please don\'t hesitate to reach out.',
  'We hope to exceed your expectations on your next visit.',
  'Please feel free to contact us directly if you\'d like to share more details.',
];

const NEGATIVE_OPENERS = [
  (name) => `${name}, thank you for bringing this to our attention.`,
  (name) => `We\'re sorry to hear about your experience, ${name}.`,
  (name) => `${name}, we sincerely apologize for the disappointment.`,
  (name) => `Thank you for sharing this feedback, ${name}. We take it very seriously.`,
];

const NEGATIVE_MIDDLES = {
  service: [
    'This is not the level of service we strive for, and we want to make it right.',
    'We hold our team to high standards, and we\'re sorry we fell short.',
  ],
  quality: [
    'We expect much better quality from ourselves and are investigating what went wrong.',
    'This doesn\'t meet our standards, and we\'re looking into it.',
  ],
  pricing: [
    'We understand pricing concerns and always aim for transparency. We\'d love the chance to review your bill together.',
    'Fair pricing is important to us, and we\'d like to understand your concern better.',
  ],
  wait: [
    'We understand how frustrating long wait times can be, and we\'re actively working to improve.',
    'Your time is valuable, and we\'re sorry we didn\'t respect that.',
  ],
  cleanliness: [
    'Cleanliness is a top priority, and we\'re sorry we didn\'t meet that standard during your visit.',
    'We take cleanliness very seriously and are addressing this immediately.',
  ],
  communication: [
    'Clear communication is essential, and we\'re sorry we dropped the ball.',
    'We should have kept you better informed, and we\'re taking steps to improve.',
  ],
  food: [
    'We\'re sorry the food didn\'t meet your expectations. We hold our kitchen to high standards.',
    'This isn\'t the quality we aim for. We\'re reviewing this with our kitchen team.',
  ],
  professionalism: [
    'Professionalism is non-negotiable for us, and we\'re sorry we fell short.',
    'This behavior doesn\'t reflect our values, and we\'re addressing it internally.',
  ],
  location: [
    'We appreciate your feedback about our location and are always looking for ways to improve accessibility.',
  ],
};

const NEGATIVE_CLOSERS = [
  'We would love the opportunity to make this right. Please reach out to us directly so we can address your concerns personally.',
  'Please don\'t hesitate to contact us so we can resolve this. Your satisfaction matters to us.',
  'We\'d appreciate the chance to discuss this further and find a resolution that works for you.',
];

// ─── Main Generator ──────────────────────────────────────────────────────────

/**
 * Generate a personalized review response using templates.
 *
 * @param {object} params
 * @param {object} params.review
 * @param {number} params.review.rating
 * @param {string} params.review.comment
 * @param {string} [params.review.reviewerName]
 * @param {object} params.business
 * @param {string} params.business.name
 * @param {string} params.business.type
 * @param {string} [params.business.brandVoice]
 * @param {string} [params.business.signatureStyle]
 * @returns {{ response: string, sentiment: string }}
 */
export function generateTemplateResponse(params) {
  const { review, business } = params;
  const { rating, comment, reviewerName = 'there' } = review;
  const { name: bizName, brandVoice = 'professional', signatureStyle = 'business-name' } = business;

  const firstName = reviewerName.split(' ')[0] || 'there';
  const topics = extractTopics(comment);
  const primaryTopic = topics[0];

  let sentiment, opener, middle, closer;

  if (rating >= 4) {
    // Positive
    sentiment = 'positive';
    opener = pick(POSITIVE_OPENERS)(firstName);
    const topicMiddles = POSITIVE_MIDDLES[primaryTopic] || POSITIVE_MIDDLES.service;
    middle = pick(topicMiddles);
    const voiceClosers = POSITIVE_CLOSERS[brandVoice] || POSITIVE_CLOSERS.professional;
    closer = pick(voiceClosers);
  } else if (rating === 3) {
    // Neutral
    sentiment = 'neutral';
    opener = pick(NEUTRAL_OPENERS)(firstName);
    middle = pick(NEUTRAL_MIDDLES);
    closer = pick(NEUTRAL_CLOSERS);
  } else {
    // Negative
    sentiment = 'negative';
    opener = pick(NEGATIVE_OPENERS)(firstName);
    const topicMiddles = NEGATIVE_MIDDLES[primaryTopic] || NEGATIVE_MIDDLES.service;
    middle = pick(topicMiddles);
    closer = pick(NEGATIVE_CLOSERS);
  }

  // Build signature
  let signature = '';
  switch (signatureStyle) {
    case 'first-person':
      signature = ''; // no explicit signature
      break;
    case 'we':
      signature = `\n\n— The ${bizName} Team`;
      break;
    case 'business-name':
    default:
      signature = `\n\n— ${bizName}`;
  }

  const response = `${opener} ${middle} ${closer}${signature}`;

  return { response, sentiment };
}
