import { teamDbExec } from "./lib/db.js";
import { pollActiveAccounts } from "./index.js";

// Force mock fetching mode for demo
process.env.MOCK_POLLING = "true";

async function runDemo() {
  console.log("======================================================");
  console.log("      ReviewPilot — Review Polling Service Demo      ");
  console.log("======================================================\n");

  // 1. Check if we have a demo user and business in the DB, if not create them
  console.log("[Demo] Setting up seed database records...");
  let user = teamDbExec("SELECT id FROM users LIMIT 1");
  let userId;
  if (!user || user.length === 0) {
    userId = "demo-user-123";
    teamDbExec(
      `INSERT INTO users (id, email, name, password_hash) VALUES ('${userId}', 'demo@example.com', 'Demo User', 'no_password_hash')`
    );
  } else {
    userId = user[0].id;
  }

  let business = teamDbExec(`SELECT id FROM businesses WHERE user_id = '${userId}' LIMIT 1`);
  let businessId;
  if (!business || business.length === 0) {
    businessId = "demo-business-123";
    teamDbExec(
      `INSERT INTO businesses (id, user_id, business_name, business_type, location, brand_voice, signature_style) VALUES ('${businessId}', '${userId}', 'Downtown Dental Clinic', 'dental', 'Portland, OR', 'warm', 'first-person')`
    );
  } else {
    businessId = business[0].id;
  }

  // 2. Ensure connected accounts exist for GBP and Yelp
  let connectedAccounts = teamDbExec(`SELECT id FROM connected_accounts WHERE business_id = '${businessId}'`);
  if (!connectedAccounts || connectedAccounts.length === 0) {
    teamDbExec(
      `INSERT INTO connected_accounts (id, business_id, platform, platform_business_id, is_active) VALUES ('demo-ca-google', '${businessId}', 'google', 'accounts/123/locations/456', 1)`
    );
    teamDbExec(
      `INSERT INTO connected_accounts (id, business_id, platform, platform_business_id, is_active) VALUES ('demo-ca-yelp', '${businessId}', 'yelp', 'downtown-dental-clinic-portland', 1)`
    );
  }

  console.log("[Demo] Seed setup complete.");
  console.log(`[Demo] User ID: ${userId}`);
  console.log(`[Demo] Business ID: ${businessId}`);
  console.log("------------------------------------------------------");

  // 3. Clear existing reviews for this business to make the demo import visible
  console.log("[Demo] Clearing existing reviews to demonstrate clean import...");
  teamDbExec(`DELETE FROM reviews WHERE business_id = '${businessId}'`);

  // 4. Run the poller once
  console.log("[Demo] Triggering pollActiveAccounts()...");
  await pollActiveAccounts();

  // 5. Query and display imported reviews
  console.log("\n------------------------------------------------------");
  console.log("[Demo] Displaying reviews from SQLite DB:");
  const dbReviews = teamDbExec(
    `SELECT platform, reviewer_name, rating, text, sentiment, is_flagged, response_text FROM reviews WHERE business_id = '${businessId}'`
  );

  if (dbReviews && dbReviews.length > 0) {
    dbReviews.forEach((r, idx) => {
      console.log(`\nReview #${idx + 1} [${r.platform.toUpperCase()}]`);
      console.log(`Reviewer:  ${r.reviewer_name}`);
      console.log(`Rating:    ${r.rating} stars`);
      console.log(`Sentiment: ${r.sentiment} ${r.is_flagged ? "⚠️ FLAGGED" : ""}`);
      console.log(`Text:      "${r.text}"`);
      console.log(`AI Draft:  "${r.response_text}"`);
    });
  } else {
    console.log("[Demo] No reviews found in DB.");
  }

  console.log("\n======================================================");
  console.log("            Polling Service Demo Completed            ");
  console.log("======================================================");
}

runDemo().catch(console.error);
