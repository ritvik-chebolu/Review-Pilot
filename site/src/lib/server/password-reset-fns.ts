import { createServerFn } from "@tanstack/react-start";
import { teamDbExec } from "./team-db";
import { v4 as uuidv4 } from "uuid";
import { hashPassword, findUserByEmail } from "./auth-utils";

/**
 * Password reset flow:
 *   1. User submits email → sendPasswordReset() generates a token and "sends" email
 *   2. User clicks link in email → resetPassword() validates token and sets new password
 *
 * In development/free mode without RESEND_API_KEY, the reset token is logged
 * to console for testing.
 */

let _tableChecked = false;
function ensurePasswordTokensTableExists() {
  if (_tableChecked) return;
  try {
    teamDbExec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    _tableChecked = true;
  } catch {
    // Table may already exist
  }
}

export const sendPasswordReset = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    ensurePasswordTokensTableExists();
    const user = findUserByEmail(data.email.trim().toLowerCase());
    if (!user) {
      // Don't reveal whether email exists — always return success
      return { ok: true, message: "If an account with that email exists, a reset link has been sent." };
    }

    // Generate token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    teamDbExec(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES ('${uuidv4()}', '${user.id}', '${token}', '${expiresAt}')`
    );

    // Attempt to send email
    const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    try {
      if (process.env.RESEND_API_KEY) {
        const { sendEmail } = await import("../../../../email-engine/lib/resend.js");
        await sendEmail({
          to: user.email,
          subject: "Reset your ReviewPilot password",
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <h2 style="color: #fff; margin-bottom: 16px;">Reset your password</h2>
              <p style="color: #94a3b8; line-height: 1.6;">
                Click the button below to reset your ReviewPilot password. This link expires in 1 hour.
              </p>
              <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: linear-gradient(to right, #6366f1, #8b5cf6); color: #fff; border-radius: 9999px; text-decoration: none; font-weight: 600;">
                Reset password
              </a>
              <p style="color: #64748b; font-size: 14px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      } else {
        console.log(`[PasswordReset] Reset link for ${user.email}: ${resetUrl}`);
      }
    } catch (err) {
      console.error("[PasswordReset] Failed to send email:", (err as Error).message);
      console.log(`[PasswordReset] Fallback — Reset link: ${resetUrl}`);
    }

    return { ok: true, message: "If an account with that email exists, a reset link has been sent." };
  });

export const resetPassword = createServerFn({ method: "POST" })
  .validator((data: { token: string; newPassword: string }) => data)
  .handler(async ({ data }) => {
    ensurePasswordTokensTableExists();
    if (!data.newPassword || data.newPassword.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }

    // Find valid token
    const tokenResult = teamDbExec(
      `SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = '${data.token}' LIMIT 1`
    ) as { id: string; user_id: string; expires_at: string; used: number }[] | null;

    if (!tokenResult || tokenResult.length === 0) {
      return { ok: false, error: "Invalid or expired reset link." };
    }

    const record = tokenResult[0];

    if (record.used) {
      return { ok: false, error: "This reset link has already been used." };
    }

    if (new Date(record.expires_at) < new Date()) {
      return { ok: false, error: "This reset link has expired. Please request a new one." };
    }

    // Hash new password and update user
    const newHash = await hashPassword(data.newPassword);

    teamDbExec(
      `UPDATE users SET password_hash = ${JSON.stringify(newHash)} WHERE id = '${record.user_id}'`
    );

    // Mark token as used
    teamDbExec(
      `UPDATE password_reset_tokens SET used = 1 WHERE id = '${record.id}'`
    );

    return { ok: true };
  });
