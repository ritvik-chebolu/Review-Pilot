import { createServerFn } from "@tanstack/react-start";
import { teamDbExec } from "./team-db";
import { v4 as uuidv4 } from "uuid";

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'starter' | 'growth' | 'pro';
  stripe_subscription_id: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'unpaid';
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

export const getSubscription = createServerFn({ method: "GET" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }): Promise<Subscription | null> => {
    const result = teamDbExec(
      `SELECT * FROM subscriptions WHERE user_id = ${JSON.stringify(data.userId)} AND status = 'active' LIMIT 1`
    ) as Subscription[] | null;

    if (!result || result.length === 0) return null;
    return result[0];
  });

export const createSubscription = createServerFn({ method: "POST" })
  .validator((data: { userId: string; plan: 'starter' | 'growth' | 'pro' }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; subscription?: Subscription; error?: string }> => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
      teamDbExec(
        `INSERT INTO subscriptions (id, user_id, plan, status, current_period_start, current_period_end)
         VALUES (
           '${id}',
           ${JSON.stringify(data.userId)},
           '${data.plan}',
           'active',
           '${now}',
           '${oneMonthLater}'
         )`
      );

      const created = teamDbExec(
        `SELECT * FROM subscriptions WHERE id = '${id}'`
      ) as Subscription[] | null;

      return { ok: true, subscription: created?.[0] };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });
