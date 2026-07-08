import { createServerFn } from "@tanstack/react-start";
import { teamDbExec } from "./team-db";

/**
 * Post a reply to a Google Business Profile review.
 *
 * Uses the Google Business Profile API:
 *   PUT /v4/{name}/reply
 *
 * For Yelp: no public reply API exists. Users copy the drafted response
 * and paste it manually.
 */
export const postGbpReply = createServerFn({ method: "POST" })
  .validator((data: { reviewId: string; responseText: string; userId: string }) => data)
  .handler(async ({ data }) => {
    const esc = JSON.stringify;

    // 1. Get the review + connected account info
    const reviewResult = teamDbExec(
      `SELECT r.id, r.platform, r.platform_review_id, r.business_id, ca.auth_token, ca.platform_business_id
       FROM reviews r
       JOIN businesses b ON r.business_id = b.id
       JOIN connected_accounts ca ON ca.business_id = b.id AND ca.platform = r.platform AND ca.is_active = 1
       WHERE r.id = ${esc(data.reviewId)} AND b.user_id = ${esc(data.userId)}
       LIMIT 1`
    ) as Array<{
      id: string;
      platform: string;
      platform_review_id: string;
      business_id: string;
      auth_token: string;
      platform_business_id: string;
    }> | null;

    if (!reviewResult || reviewResult.length === 0) {
      return { ok: false, error: "Review not found or no connected account.", posted: false };
    }

    const review = reviewResult[0];

    // Only attempt posting for Google reviews
    if (review.platform !== "google") {
      return {
        ok: true,
        posted: false,
        message: "Yelp does not support API-based replies. Response saved as draft.",
      };
    }

    if (!review.auth_token || !review.platform_review_id) {
      return { ok: false, error: "Missing OAuth token or review ID.", posted: false };
    }

    // 2. Call the GBP reply API
    const replyUrl = `https://mybusiness.googleapis.com/v4/${review.platform_business_id}/reviews/${review.platform_review_id}/reply`;

    try {
      const response = await fetch(replyUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${review.auth_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: data.responseText }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("[GBP Reply] Failed:", response.status, errorBody);
        return {
          ok: true,
          posted: false,
          message: `Response saved. Google API returned ${response.status} — reply may need manual posting.`,
        };
      }

      // Mark as responded in DB
      teamDbExec(
        `UPDATE reviews SET responded_at = datetime('now') WHERE id = ${esc(data.reviewId)}`
      );

      console.log(`[GBP Reply] Successfully posted reply for review ${data.reviewId}`);
      return { ok: true, posted: true, message: "Reply posted to Google Business Profile." };
    } catch (err) {
      console.error("[GBP Reply] Network error:", (err as Error).message);
      return {
        ok: true,
        posted: false,
        message: "Response saved. Could not reach Google API — reply may need manual posting.",
      };
    }
  });
