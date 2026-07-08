import { createServerFn } from "@tanstack/react-start";
import { teamDbExec } from "./team-db";
import { v4 as uuidv4 } from "uuid";

/**
 * Google OAuth helper functions.
 *
 * Flow:
 *   1. Client calls getGoogleOAuthUrl() → gets redirect URL
 *   2. User completes Google consent → redirected to callback with ?code=
 *   3. Client calls exchangeGoogleCode(code, businessId) → tokens saved to DB
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/dashboard/settings?oauth=google";

// ── Get OAuth consent URL ─────────────────────────────────────────────────────

export const getGoogleOAuthUrl = createServerFn({ method: "GET" })
  .validator((data: { businessId: string }) => data)
  .handler(async ({ data }) => {
    if (!GOOGLE_CLIENT_ID) {
      return {
        ok: false,
        error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID in your environment.",
        url: null,
      };
    }

    const state = Buffer.from(JSON.stringify({ businessId: data.businessId })).toString("base64url");

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/business.manage",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return {
      ok: true,
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  });

// ── Exchange authorization code for tokens ────────────────────────────────────

export const exchangeGoogleCode = createServerFn({ method: "POST" })
  .validator((data: { code: string; businessId: string }) => data)
  .handler(async ({ data }) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return { ok: false, error: "Google OAuth is not configured on the server." };
    }

    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code: data.code,
          grant_type: "authorization_code",
          redirect_uri: GOOGLE_REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("[OAuth] Google token exchange failed:", errorBody);
        return { ok: false, error: "Failed to exchange authorization code." };
      }

      const tokenData = await response.json();
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token || "";
      const expiresIn = tokenData.expires_in || 3600;
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      // Fetch GBP accounts/locations to get the location path
      let platformBusinessId = "pending-setup";
      try {
        const accountsRes = await fetch(
          "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json();
          const account = accountsData.accounts?.[0];
          if (account) {
            // Try to get first location
            const locRes = await fetch(
              `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (locRes.ok) {
              const locData = await locRes.json();
              const location = locData.locations?.[0];
              if (location) {
                platformBusinessId = location.name; // e.g. "locations/1234"
              }
            }
          }
        }
      } catch (err) {
        console.warn("[OAuth] Could not auto-detect GBP location:", (err as Error).message);
      }

      // Save to connected_accounts
      const existing = teamDbExec(
        `SELECT id FROM connected_accounts WHERE business_id = '${data.businessId}' AND platform = 'google' LIMIT 1`
      ) as { id: string }[] | null;

      if (existing && existing.length > 0) {
        teamDbExec(
          `UPDATE connected_accounts SET
            auth_token = '${accessToken}',
            refresh_token = '${refreshToken}',
            token_expires_at = '${expiresAt}',
            platform_business_id = '${platformBusinessId}',
            is_active = 1,
            updated_at = datetime('now')
          WHERE id = '${existing[0].id}'`
        );
      } else {
        const id = uuidv4();
        teamDbExec(
          `INSERT INTO connected_accounts (id, business_id, platform, platform_business_id, auth_token, refresh_token, token_expires_at, is_active)
          VALUES ('${id}', '${data.businessId}', 'google', '${platformBusinessId}', '${accessToken}', '${refreshToken}', '${expiresAt}', 1)`
        );
      }

      return { ok: true };
    } catch (err) {
      console.error("[OAuth] Error:", (err as Error).message);
      return { ok: false, error: "OAuth token exchange failed." };
    }
  });
