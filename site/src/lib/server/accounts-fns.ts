import { createServerFn } from "@tanstack/react-start";
import { teamDbExec } from "./team-db";
import { v4 as uuidv4 } from "uuid";

// ── List connected accounts for a business ────────────────────────────────────
export const getConnectedAccounts = createServerFn({ method: "GET" })
  .validator((data: { businessId: string }) => data)
  .handler(async ({ data }) => {
    const rows = teamDbExec(
      `SELECT id, platform, platform_business_id, is_active, created_at, updated_at
       FROM connected_accounts
       WHERE business_id = '${data.businessId}'
       ORDER BY created_at DESC`
    );
    return rows || [];
  });

// ── Add / update a connected account ─────────────────────────────────────────
export const upsertConnectedAccount = createServerFn({ method: "POST" })
  .validator((data: {
    businessId: string;
    platform: "google" | "yelp";
    platformBusinessId: string;
    authToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: string;
  }) => data)
  .handler(async ({ data }) => {
    // Check if one already exists for this business + platform
    const existing = teamDbExec(
      `SELECT id FROM connected_accounts WHERE business_id = '${data.businessId}' AND platform = '${data.platform}' LIMIT 1`
    );

    if (existing && existing.length > 0) {
      const id = existing[0].id;
      teamDbExec(
        `UPDATE connected_accounts
         SET platform_business_id = '${data.platformBusinessId}',
             auth_token = '${data.authToken || ""}',
             refresh_token = '${data.refreshToken || ""}',
             token_expires_at = ${data.tokenExpiresAt ? `'${data.tokenExpiresAt}'` : "NULL"},
             is_active = 1,
             updated_at = datetime('now')
         WHERE id = '${id}'`
      );
      return { ok: true, id };
    }

    const id = uuidv4();
    teamDbExec(
      `INSERT INTO connected_accounts
         (id, business_id, platform, platform_business_id, auth_token, refresh_token, token_expires_at, is_active)
       VALUES
         ('${id}', '${data.businessId}', '${data.platform}', '${data.platformBusinessId}',
          '${data.authToken || ""}', '${data.refreshToken || ""}',
          ${data.tokenExpiresAt ? `'${data.tokenExpiresAt}'` : "NULL"}, 1)`
    );
    return { ok: true, id };
  });

// ── Deactivate / disconnect a connected account ───────────────────────────────
export const disconnectAccount = createServerFn({ method: "POST" })
  .validator((data: { accountId: string; businessId: string }) => data)
  .handler(async ({ data }) => {
    teamDbExec(
      `UPDATE connected_accounts
       SET is_active = 0, updated_at = datetime('now')
       WHERE id = '${data.accountId}' AND business_id = '${data.businessId}'`
    );
    return { ok: true };
  });
