# ReviewPilot — AI Review Response Engine

The core AI module that generates personalized, on-brand responses to customer reviews.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up your API key
cp .env.example .env
# Edit .env with your OPENAI_API_KEY

# 3. Run the demo
node demo.js
```

## Usage

```javascript
import { generateResponse } from './index.js';

const result = await generateResponse({
  review: {
    rating: 4,
    comment: 'Great service! They fixed my car quickly.',
    reviewerName: 'Jane D.',
  },
  business: {
    name: 'Smith Auto Repair',
    type: 'auto repair shop',
    brandVoice: 'casual',
    signatureStyle: 'we',
  },
});

console.log(result.response);
// "Thanks Jane! We're glad we could get you back on the road fast..."
```

## Module Structure

```
review-engine/
├── index.js          # Main entry point — unified generateResponse()
├── config.js         # Env-based configuration
├── demo.js           # Demo runner with example reviews
├── prompts.md        # Full prompt engineering documentation
├── package.json
├── .env.example
├── test/
│   └── prompts.test.js  # Unit tests for prompt builders
└── lib/
    ├── prompts.js    # Prompt template builders
    ├── openai.js     # OpenAI provider (GPT-4o-mini)
    └── claude.js     # Claude provider (Claude 3.5 Haiku)
```

## API

### `generateResponse(params)`

| Param | Type | Required | Default |
|-------|------|----------|---------|
| `review.rating` | number (1-5) | ✅ | — |
| `review.comment` | string | ✅ | — |
| `review.reviewerName` | string | ❌ | "a customer" |
| `business.name` | string | ✅ | — |
| `business.type` | string | ✅ | — |
| `business.brandVoice` | string | ❌ | "professional" |
| `business.signatureStyle` | string | ❌ | "we" |

Returns: `{ response, sentiment, provider, model, usage, usedFallback }`

## Provider Routing

- **OpenAI GPT-4o-mini** — primary for all reviews (~$0.0001/response)
- **Claude 3.5 Haiku** — automatic fallback for negative reviews when `ANTHROPIC_API_KEY` is set

## Testing

```bash
# Run unit tests (no API calls needed)
npm test
```

## Prompt Design

See `prompts.md` for the complete prompt engineering documentation,
including prompt templates, examples by rating tier, and cost budgeting.