/**
 * Fetch reviews from Yelp Business Reviews API.
 */
export async function fetchYelpReviews(account) {
  if (process.env.MOCK_POLLING === 'true') {
    return [
      {
        platform_review_id: `y_mock_${Date.now()}_1`,
        reviewer_name: "Mock Yelp Reviewer 1",
        rating: 2,
        text: "The wait was incredibly long. I was told 20 mins but waited almost an hour. Food was cold when it arrived.",
        posted_at: new Date().toISOString(),
      },
      {
        platform_review_id: `y_mock_${Date.now()}_2`,
        reviewer_name: "Mock Yelp Reviewer 2",
        rating: 4,
        text: "Pretty solid experience. Quick response and professional staff.",
        posted_at: new Date().toISOString(),
      }
    ];
  }

  const apiKey = account.auth_token || process.env.YELP_API_KEY;
  if (!apiKey) {
    console.error(`[Yelp] API Key not configured for account ${account.id}`);
    return [];
  }

  // platform_business_id is either yelp business ID or alias
  const businessId = account.platform_business_id;
  const url = `https://api.yelp.com/v3/businesses/${businessId}/reviews`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Yelp API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const yelpReviews = data.reviews || [];

    // Map to normalized Review structure
    return yelpReviews.map((r) => {
      // Yelp times are returned in "YYYY-MM-DD HH:MM:SS" format, convert to ISO 8601
      let postedAt = new Date().toISOString();
      if (r.time_created) {
        postedAt = new Date(r.time_created.replace(" ", "T")).toISOString();
      }

      return {
        platform_review_id: r.id,
        reviewer_name: r.user?.name || "Anonymous",
        rating: r.rating || 5,
        text: r.text || "",
        posted_at: postedAt,
      };
    });
  } catch (err) {
    console.error(`[Yelp] Failed to fetch reviews for business ${account.platform_business_id}:`, err.message);
    return [];
  }
}
