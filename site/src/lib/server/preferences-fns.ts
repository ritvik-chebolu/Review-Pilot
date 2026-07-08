import { createServerFn } from "@tanstack/react-start";
import { teamDbExec } from "./team-db";

export interface UserPreferences {
  user_id: string;
  email_alerts: number;
  daily_digest: number;
  weekly_summary: number;
  sms_alerts: number;
  sms_phone: string;
}

let _tableChecked = false;
function ensurePreferencesTableExists() {
  if (_tableChecked) return;
  try {
    teamDbExec(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        email_alerts INTEGER NOT NULL DEFAULT 1,
        daily_digest INTEGER NOT NULL DEFAULT 1,
        weekly_summary INTEGER NOT NULL DEFAULT 1,
        sms_alerts INTEGER NOT NULL DEFAULT 0,
        sms_phone TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    _tableChecked = true;
  } catch (err) {
    console.warn("Failed to initialize user_preferences table:", (err as Error).message);
  }
}

export const getPreferences = createServerFn({ method: "GET" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }): Promise<UserPreferences> => {
    ensurePreferencesTableExists();
    const esc = JSON.stringify;
    const result = teamDbExec(
      `SELECT * FROM user_preferences WHERE user_id = ${esc(data.userId)} LIMIT 1`
    ) as UserPreferences[] | null;

    if (!result || result.length === 0) {
      // Return defaults
      return {
        user_id: data.userId,
        email_alerts: 1,
        daily_digest: 1,
        weekly_summary: 1,
        sms_alerts: 0,
        sms_phone: "",
      };
    }
    return result[0];
  });

export const updatePreferences = createServerFn({ method: "POST" })
  .validator((data: {
    userId: string;
    emailAlerts: boolean;
    dailyDigest: boolean;
    weeklySummary: boolean;
    smsAlerts: boolean;
    smsPhone: string;
  }) => data)
  .handler(async ({ data }) => {
    ensurePreferencesTableExists();
    const esc = JSON.stringify;
    const email_alerts = data.emailAlerts ? 1 : 0;
    const daily_digest = data.dailyDigest ? 1 : 0;
    const weekly_summary = data.weeklySummary ? 1 : 0;
    const sms_alerts = data.smsAlerts ? 1 : 0;

    const existing = teamDbExec(
      `SELECT user_id FROM user_preferences WHERE user_id = ${esc(data.userId)} LIMIT 1`
    ) as { user_id: string }[] | null;

    if (existing && existing.length > 0) {
      teamDbExec(`
        UPDATE user_preferences SET
          email_alerts = ${email_alerts},
          daily_digest = ${daily_digest},
          weekly_summary = ${weekly_summary},
          sms_alerts = ${sms_alerts},
          sms_phone = ${esc(data.smsPhone)}
        WHERE user_id = ${esc(data.userId)}
      `);
    } else {
      teamDbExec(`
        INSERT INTO user_preferences (user_id, email_alerts, daily_digest, weekly_summary, sms_alerts, sms_phone)
        VALUES (${esc(data.userId)}, ${email_alerts}, ${daily_digest}, ${weekly_summary}, ${sms_alerts}, ${esc(data.smsPhone)})
      `);
    }

    return { ok: true };
  });
