import { v4 as uuidv4 } from "uuid";
import { teamDbExec } from "./lib/db.js";
import { fetchGbpReviews } from "./lib/gbp.js";
import { fetchYelpReviews } from "./lib/yelp.js";
import { generateResponse } from "../review-engine/index.js";

/**
 * Poll all active connected accounts for new reviews.
 * Works without any API keys — uses template engine by default.
 */
export async function pollActiveAccounts() {
  console.log(`[Poller] Starting poll cycle at ${new Date().toISOString()}...`);

  // 1. Get active connected accounts
  const accounts = teamDbExec(
    "SELECT id, business_id, platform, platform_business_id, auth_token, refresh_token, token_expires_at, is_active FROM connected_accounts WHERE is_active = 1"
  );

  if (!accounts || accounts.length === 0) {
    console.log("[Poller] No active connected accounts found.");
    return { polled: 0, newReviews: 0 };
  }

  console.log(`[Poller] Found ${accounts.length} active connected accounts.`);

  let totalNewReviews = 0;

  for (const account of accounts) {
    try {
      console.log(`[Poller] Processing account ${account.id} (${account.platform}) for business ${account.business_id}`);

      // 2. Fetch business context
      const businessResult = teamDbExec(
        `SELECT id, business_name, business_type, location, brand_voice, signature_style, custom_instructions FROM businesses WHERE id = '${account.business_id}'`
      );
      if (!businessResult || businessResult.length === 0) {
        console.error(`[Poller] Business context not found for ID: ${account.business_id}`);
        continue;
      }
      const business = businessResult[0];

      // Also get the business owner's email for notifications
      const userResult = teamDbExec(
        `SELECT u.email FROM users u JOIN businesses b ON b.user_id = u.id WHERE b.id = '${account.business_id}'`
      );
      const ownerEmail = userResult?.[0]?.email || null;

      // 3. Fetch reviews from the platform
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

      // 4. Process each review
      for (const review of platformReviews) {
        // Deduplicate
        const existsCheck = teamDbExec(
          `SELECT id FROM reviews WHERE business_id = '${account.business_id}' AND platform = '${account.platform}' AND platform_review_id = '${review.platform_review_id}'`
        );

        if (existsCheck && existsCheck.length > 0) {
          continue;
        }

        console.log(`[Poller] New review detected from ${review.reviewer_name} (${review.rating} stars)`);

        // Generate response (template by default, API if keys are set)
        let aiDraftReply = "";
        let sentiment = review.rating >= 4 ? "positive" : review.rating === 3 ? "neutral" : "negative";

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
          console.log(`[Poller] Response generated via ${aiRes.provider} (${aiRes.model})`);
        } catch (aiErr) {
          console.warn(`[Poller] Response generation failed: ${aiErr.message}`);
          aiDraftReply = `Thank you for your feedback. We value your input and will look into this.`;
        }

        // Insert new review
        const newReviewId = uuidv4();
        const isFlagged = review.rating <= 2 ? 1 : 0;
        const esc = (str) => (str || "").replace(/'/g, "''");

        teamDbExec(
          `INSERT INTO reviews (id, business_id, platform, platform_review_id, reviewer_name, rating, text, posted_at, response_text, sentiment, is_flagged) VALUES ('${newReviewId}', '${account.business_id}', '${account.platform}', '${review.platform_review_id}', '${esc(review.reviewer_name)}', ${review.rating}, '${esc(review.text)}', '${review.posted_at}', '${esc(aiDraftReply)}', '${sentiment}', ${isFlagged})`
        );

        totalNewReviews++;
        console.log(`[Poller] Saved review ${newReviewId} with draft response.`);

        // Send email alert for negative reviews (1-2 stars)
        if (isFlagged && ownerEmail) {
          try {
            // Dynamically import email engine to avoid requiring it when not configured
            const { processNewReview } = await import("../email-engine/services/notificationService.js");
            const { sendEmail } = await import("../email-engine/lib/resend.js");

            const notifications = processNewReview(
              {
                rating: review.rating,
                reviewerName: review.reviewer_name,
                comment: review.text,
                reviewDate: review.posted_at,
              },
              {
                name: business.business_name,
                email: ownerEmail,
              },
              {
                aiDraftReply,
                approveUrl: `#`, // TODO: deep link to dashboard review
                editUrl: `#`,
              }
            );

            for (const notif of notifications) {
              await sendEmail({ to: notif.to, subject: notif.subject, html: notif.html });
              console.log(`[Poller] Sent ${notif.type} email to ${notif.to}`);
            }
          } catch (emailErr) {
            console.warn(`[Poller] Email notification failed (non-critical): ${emailErr.message}`);
          }
        }
      }
    } catch (accountErr) {
      console.error(`[Poller] Error processing account ${account.id}:`, accountErr.message);
    }
  }

  console.log(`[Poller] Poll cycle completed. ${totalNewReviews} new reviews imported.`);
  return { polled: accounts.length, newReviews: totalNewReviews };
}

// Support running directly or as module
if (process.argv[1]?.endsWith("index.js")) {
  pollActiveAccounts();
  // Poll every 30 minutes
  setInterval(pollActiveAccounts, 30 * 60 * 1000);
}
