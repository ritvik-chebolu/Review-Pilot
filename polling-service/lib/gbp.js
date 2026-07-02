import { teamDbExec } from "./db.js";

/**
 * Refresh Google OAuth token if needed.
 */
export async function refreshGoogleToken(account) {
  const now = new Date();
  const expiry = account.token_expires_at ? new Date(account.token_expires_at) : null;

  // If token expires in less than 5 minutes, refresh it
  if (expiry && (expiry.getTime() - now.getTime()) > 5 * 60 * 1000) {
    return account.auth_token;
  }

  console.log(`[GBP] Token expired or expiring soon for account ${account.id}. Refreshing...`);
  
  if (process.env.MOCK_POLLING === 'true' || !process.env.GOOGLE_CLIENT_ID) {
    // Mock refresh
    const newExpiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    const mockToken = `mock_gbp_access_token_${Date.now()}`;
    teamDbExec(
      `UPDATE connected_accounts SET auth_token = ${JSON.stringify(mockToken)}, token_expires_at = ${JSON.stringify(newExpiresAt)}, updated_at = datetime('now') WHERE id = ${JSON.stringify(account.id)}`
    );
    return mockToken;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: account.refresh_token || "",
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error(`Google token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    const newExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
    const newAccessToken = data.access_token;

    teamDbExec(
      `UPDATE connected_accounts SET auth_token = ${JSON.stringify(newAccessToken)}, token_expires_at = ${JSON.stringify(newExpiresAt)}, updated_at = datetime('now') WHERE id = ${JSON.stringify(account.id)}`
    );

    return newAccessToken;
  } catch (err) {
    console.error(`[GBP] Token refresh failed for account ${account.id}:`, err.message);
    return account.auth_token; // Fallback to current token
  }
}

/**
 * Fetch reviews from Google Business Profile.
 */
export async function fetchGbpReviews(account) {
  if (process.env.MOCK_POLLING === 'true') {
    return [
      {
        platform_review_id: `g_mock_${Date.now()}_1`,
        reviewer_name: "Mock Google Reviewer 1",
        rating: 1,
        text: "Terrible service at this location. Will not come back.",
        posted_at: new Date().toISOString(),
      },
      {
        platform_review_id: `g_mock_${Date.now()}_2`,
        reviewer_name: "Mock Google Reviewer 2",
        rating: 5,
        text: "Fantastic experience! Clean facilities and super friendly staff.",
        posted_at: new Date().toISOString(),
      }
    ];
  }

  const token = await refreshGoogleToken(account);
  // Endpoint format: accounts/{accountId}/locations/{locationId}/reviews
  const locationPath = account.platform_business_id; // holds accounts/.../locations/...
  const url = `https://mybusiness.googleapis.com/v4/${locationPath}/reviews?pageSize=50`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const gbpReviews = data.reviews || [];

    // Map to normalized Review structure
    return gbpReviews.map((r) => {
      // Rating is represented as "ONE", "TWO", etc. in Google API
      const ratingMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
      const rating = ratingMap[r.starRating] || 5;

      return {
        platform_review_id: r.reviewId,
        reviewer_name: r.reviewer?.displayName || "Anonymous",
        rating,
        text: r.comment || "",
        posted_at: r.createTime || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error(`[GBP] Failed to fetch reviews for location ${account.platform_business_id}:`, err.message);
    return [];
  }
}
