import { v4 as uuidv4 } from "uuid";
import { teamDbExec } from "./lib/db.js";
import { fetchGbpReviews } from "./lib/gbp.js";
import { fetchYelpReviews } from "./lib/yelp.js";
import { generateResponse } from "../review-engine/index.js";

/**
 * Poll all active connected accounts for new reviews.
 */
export async function pollActiveAccounts() {
  console.log(`[Poller] Starting poll cycle at ${new Date().toISOString()}...`);

  // 1. Get active connected accounts
  const accounts = teamDbExec(
    "SELECT id, business_id, platform, platform_business_id, auth_token, refresh_token, token_expires_at, is_active FROM connected_accounts WHERE is_active = 1"
  );

  if (!accounts || accounts.length === 0) {
    console.log("[Poller] No active connected accounts found.");
    return;
  }

  console.log(`[Poller] Found ${accounts.length} active connected accounts.`);

  for (const account of accounts) {
    try {
      console.log(`[Poller] Processing account ${account.id} (${account.platform}) for business ${account.business_id}`);

      // 2. Fetch business context for AI response generation
      const businessResult = teamDbExec(
        `SELECT id, business_name, business_type, location, brand_voice, signature_style, custom_instructions FROM businesses WHERE id = '${account.business_id}'`
      );
      if (!businessResult || businessResult.length === 0) {
        console.error(`[Poller] Business context not found for ID: ${account.business_id}`);
        continue;
      }
      const business = businessResult[0];

      // 3. Fetch reviews from appropriate platform
      let platformReviews = [];
      if (account.platform === "google") {
        platformReviews = await fetchGbpReviews(account);
      } else if (account.platform === "yelp") {
        platformReviews = await fetchYelpReviews(account);
      } else {
        console.warn(`[Poller] Unsupported platform: ${account.platform}`);
        continue;
      }

      console.log(`[Poller] Fetched ${platformReviews.length} reviews from ${account.platform}`);

      // 4. Process reviews
      for (const review of platformReviews) {
        // Check if review already exists
        const existsCheck = teamDbExec(
          `SELECT id FROM reviews WHERE business_id = '${account.business_id}' AND platform = '${account.platform}' AND platform_review_id = '${review.platform_review_id}'`
        );

        if (existsCheck && existsCheck.length > 0) {
          // Already imported
          continue;
        }

        console.log(`[Poller] New review detected from ${review.reviewer_name} (${review.rating} stars)`);

        // Generate AI response
        let aiDraftReply = "";
        let sentiment = review.rating >= 4 ? "positive" : review.rating === 3 ? "neutral" : "negative";

        if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
          try {
            const aiRes = await generateResponse({
              review: { rating: review.rating, comment: review.text, reviewerName: review.reviewer_name },
              business: {
                name: business.business_name,
                type: business.business_type,
                brandVoice: business.brand_voice,
                signatureStyle: business.signature_style,
                customInstructions: business.custom_instructions,
              },
            });
            aiDraftReply = aiRes.response;
            sentiment = aiRes.sentiment;
          } catch (aiErr) {
            console.warn(`[Poller] AI response generation failed: ${aiErr.message}. Falling back to default template.`);
            aiDraftReply = buildDefaultReply(review, business);
          }
        } else {
          aiDraftReply = buildDefaultReply(review, business);
        }

        // Insert new review into the DB
        const newReviewId = uuidv4();
        const isFlagged = review.rating <= 2 ? 1 : 0;

        // Escape helper
        const esc = (str) => (str || "").replace(/'/g, "''");

        teamDbExec(
          `INSERT INTO reviews (id, business_id, platform, platform_review_id, reviewer_name, rating, text, posted_at, response_text, sentiment, is_flagged) VALUES ('${newReviewId}', '${account.business_id}', '${account.platform}', '${review.platform_review_id}', '${esc(review.reviewer_name)}', ${review.rating}, '${esc(review.text)}', '${review.posted_at}', '${esc(aiDraftReply)}', '${sentiment}', ${isFlagged})`
        );

        console.log(`[Poller] Successfully saved review ${newReviewId} and generated AI reply draft.`);
      }
    } catch (accountErr) {
      console.error(`[Poller] Error processing account ${account.id}:`, accountErr.message);
    }
  }

  console.log(`[Poller] Poll cycle completed.`);
}

/**
 * Fallback static reply when AI APIs are not available.
 */
function buildDefaultReply(review, business) {
  const name = business.business_name;
  if (review.rating >= 4) {
    return `Thank you so much for the feedback! We appreciate you choosing ${name} and look forward to serving you again.`;
  } else if (review.rating === 3) {
    return `Thank you for sharing your experience. We appreciate your feedback and are always working to improve our service at ${name}.`;
  } else {
    return `Dear customer, thank you for bringing this to our attention. We apologize for the disappointment and would love to make this right. Please contact us directly at ${name}.`;
  }
}

// Support running directly or as module setInterval
if (process.argv[1]?.endsWith("index.js")) {
  pollActiveAccounts();
  // Poll every 30 minutes
  setInterval(pollActiveAccounts, 30 * 60 * 1000);
}
