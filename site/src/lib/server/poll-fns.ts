import { createServerFn } from "@tanstack/react-start";

/**
 * API endpoint to trigger a review poll cycle.
 *
 * Protected by POLL_SECRET to prevent unauthorized access.
 * Called by a cron scheduler (GitHub Actions or external).
 */
export const triggerPoll = createServerFn({ method: "POST" })
  .validator((data: { secret?: string }) => data)
  .handler(async ({ data }) => {
    const POLL_SECRET = process.env.POLL_SECRET || "reviewpilot-dev-poll-secret";

    if (data.secret !== POLL_SECRET) {
      return { ok: false, error: "Unauthorized" };
    }

    try {
      // Dynamic import so polling service only loads when needed
      const { pollActiveAccounts } = await import("../../../../polling-service/index.js");
      const result = await pollActiveAccounts();
      return {
        ok: true,
        polled: result?.polled ?? 0,
        newReviews: result?.newReviews ?? 0,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error("[Poll API] Error:", (err as Error).message);
      return { ok: false, error: (err as Error).message };
    }
  });
