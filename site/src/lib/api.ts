import { serverLogin, serverSignup, serverGetMe } from "./server/auth-fns";
import { getBusiness, upsertBusiness } from "./server/business-fns";
import { getReviews, updateReviewResponse, saveReviewDraft, rejectReviewResponse } from "./server/review-fns";
import { getConnectedAccounts, upsertConnectedAccount, disconnectAccount } from "./server/accounts-fns";
import { getPreferences, updatePreferences } from "./server/preferences-fns";
import { sendPasswordReset, resetPassword } from "./server/password-reset-fns";
import { getGoogleOAuthUrl, exchangeGoogleCode } from "./server/oauth-fns";

export function isStaticMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname.endsWith("github.io") ||
    window.location.search.includes("static=true")
  );
}

// ─── LocalStorage Emulator Databases ─────────────────────────────────────────

const USERS_DB_KEY = "rp_emulator_users";
const BIZ_DB_KEY = "rp_emulator_businesses";
const REVIEWS_DB_KEY = "rp_emulator_reviews";
const LOGGED_IN_USER_KEY = "rp_emulator_me";

function getLocalData<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
}

function setLocalData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Seed reviews if emulator DB is empty
const SEED_REVIEWS = [
  {
    id: "seed-rev-1",
    business_id: "seed-biz-id",
    business_name: "Acme Service Clinic",
    platform: "google" as const,
    platform_review_id: "g-1",
    reviewer_name: "Amanda Miller",
    rating: 5,
    text: "Absolutely fantastic treatment. Dr. Miller explained everything clearly and the office was spotless.",
    posted_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    responded_at: null,
    response_text: "Hi Amanda, thank you so much for the kind words! We're thrilled you had a comfortable visit, and we look forward to seeing you again soon.",
    sentiment: "positive" as const,
    is_flagged: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-rev-2",
    business_id: "seed-biz-id",
    business_name: "Acme Service Clinic",
    platform: "yelp" as const,
    platform_review_id: "y-1",
    reviewer_name: "Marcus Brody",
    rating: 2,
    text: "Long wait times and the billing clerk seemed quite impatient when I asked for a breakdown of costs.",
    posted_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    responded_at: null,
    response_text: "Hello Marcus, we sincerely apologize for the wait time and billing friction you experienced. We value your feedback and would like to review this with you directly to make it right.",
    sentiment: "negative" as const,
    is_flagged: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-rev-3",
    business_id: "seed-biz-id",
    business_name: "Acme Service Clinic",
    platform: "google" as const,
    platform_review_id: "g-2",
    reviewer_name: "Richard Croft",
    rating: 4,
    text: "Professional services and very quick turnaround. Will definitely use again.",
    posted_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    responded_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    response_text: "Thank you for the review, Richard! We appreciate your trust in us.",
    sentiment: "positive" as const,
    is_flagged: 0,
    created_at: new Date().toISOString(),
  }
];

// ─── API Wrapper Layer ────────────────────────────────────────────────────────

export async function clientLogin(email: string, password: string) {
  if (isStaticMode()) {
    const users = getLocalData<any[]>(USERS_DB_KEY, []);
    const found = users.find((u) => u.email === email.trim().toLowerCase());
    if (!found) {
      return { ok: false, error: "Invalid email or password" };
    }
    const token = `emu_token_${found.id}`;
    setLocalData(LOGGED_IN_USER_KEY, found);
    return { ok: true, token, user: found };
  }

  try {
    return await serverLogin({ data: { email, password } });
  } catch {
    // Fail-safe local fallback
    return { ok: false, error: "Database offline. Switch to static sandbox mode." };
  }
}

export async function clientSignup(email: string, password: string, name: string) {
  if (isStaticMode()) {
    const users = getLocalData<any[]>(USERS_DB_KEY, []);
    const exists = users.some((u) => u.email === email.trim().toLowerCase());
    if (exists) {
      return { ok: false, error: "Email already registered" };
    }
    const newUser = { id: `emu_usr_${Date.now()}`, email: email.trim().toLowerCase(), name };
    users.push(newUser);
    setLocalData(USERS_DB_KEY, users);
    
    // Seed default business and reviews for the new emulator user
    const defaultBiz = {
      id: "seed-biz-id",
      user_id: newUser.id,
      business_name: "Acme Service Clinic",
      business_type: "medical",
      location: "Portland, OR",
      brand_voice: "warm",
      signature_style: "business-name",
      custom_instructions: "",
    };
    setLocalData(BIZ_DB_KEY, [defaultBiz]);
    setLocalData(REVIEWS_DB_KEY, SEED_REVIEWS);

    const token = `emu_token_${newUser.id}`;
    setLocalData(LOGGED_IN_USER_KEY, newUser);
    return { ok: true, token, user: newUser };
  }

  try {
    return await serverSignup({ data: { email, password, name } });
  } catch {
    return { ok: false, error: "Database offline." };
  }
}

export async function clientGetMe(token: string) {
  if (isStaticMode()) {
    return getLocalData<any>(LOGGED_IN_USER_KEY, null);
  }
  try {
    const res = await serverGetMe({ data: { token } });
    return res ? res.user : null;
  } catch {
    return null;
  }
}

export async function clientGetBusiness(userId: string) {
  if (isStaticMode()) {
    const businesses = getLocalData<any[]>(BIZ_DB_KEY, []);
    const found = businesses.find((b) => b.user_id === userId);
    return found || null;
  }
  try {
    return await getBusiness({ data: { userId } });
  } catch {
    return null;
  }
}

export async function clientUpsertBusiness(data: {
  userId: string;
  businessId?: string;
  business_name: string;
  business_type: string;
  location: string;
  brand_voice: string;
  signature_style: string;
  custom_instructions: string;
}) {
  if (isStaticMode()) {
    const businesses = getLocalData<any[]>(BIZ_DB_KEY, []);
    let id = data.businessId;
    if (id) {
      const idx = businesses.findIndex((b) => b.id === id);
      if (idx !== -1) {
        businesses[idx] = { ...businesses[idx], ...data, business_name: data.business_name.trim() };
      }
    } else {
      id = `emu_biz_${Date.now()}`;
      businesses.push({ ...data, id, business_name: data.business_name.trim() });
    }
    setLocalData(BIZ_DB_KEY, businesses);
    return { ok: true, id };
  }

  try {
    return await upsertBusiness({ data });
  } catch {
    return { ok: false, error: "Database connection failed" };
  }
}

export async function clientGetReviews(userId: string) {
  if (isStaticMode()) {
    const reviews = getLocalData<any[]>(REVIEWS_DB_KEY, SEED_REVIEWS);
    return { reviews, total: reviews.length };
  }
  try {
    return await getReviews({ data: { userId } });
  } catch {
    return { reviews: [], total: 0 };
  }
}

export async function clientUpdateReviewResponse(reviewId: string, responseText: string, userId: string) {
  if (isStaticMode()) {
    const reviews = getLocalData<any[]>(REVIEWS_DB_KEY, SEED_REVIEWS);
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx !== -1) {
      reviews[idx].response_text = responseText;
      reviews[idx].responded_at = new Date().toISOString();
      setLocalData(REVIEWS_DB_KEY, reviews);
      return { ok: true };
    }
    return { ok: false, error: "Review not found" };
  }
  try {
    return await updateReviewResponse({ data: { reviewId, responseText, userId } });
  } catch {
    return { ok: false, error: "Database offline" };
  }
}

export async function clientSaveReviewDraft(reviewId: string, responseText: string, userId: string) {
  if (isStaticMode()) {
    const reviews = getLocalData<any[]>(REVIEWS_DB_KEY, SEED_REVIEWS);
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx !== -1) {
      reviews[idx].response_text = responseText;
      setLocalData(REVIEWS_DB_KEY, reviews);
      return { ok: true };
    }
    return { ok: false, error: "Review not found" };
  }
  try {
    return await saveReviewDraft({ data: { reviewId, responseText, userId } });
  } catch {
    return { ok: false, error: "Database offline" };
  }
}

export async function clientRejectReviewResponse(reviewId: string, userId: string) {
  if (isStaticMode()) {
    const reviews = getLocalData<any[]>(REVIEWS_DB_KEY, SEED_REVIEWS);
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx !== -1) {
      reviews[idx].response_text = null;
      reviews[idx].responded_at = null;
      setLocalData(REVIEWS_DB_KEY, reviews);
      return { ok: true };
    }
    return { ok: false, error: "Review not found" };
  }
  try {
    return await rejectReviewResponse({ data: { reviewId, userId } });
  } catch {
    return { ok: false, error: "Database offline" };
  }
}

// ─── Connected Accounts ───────────────────────────────────────────────────────

const ACCOUNTS_DB_KEY = "rp_emulator_accounts";

export async function clientGetConnectedAccounts(businessId: string) {
  if (isStaticMode()) {
    const accounts = getLocalData<any[]>(ACCOUNTS_DB_KEY, []);
    return accounts.filter((a) => a.business_id === businessId);
  }
  try {
    return await getConnectedAccounts({ data: { businessId } });
  } catch {
    return [];
  }
}

export async function clientUpsertConnectedAccount(data: {
  businessId: string;
  platform: "google" | "yelp";
  platformBusinessId: string;
  authToken?: string;
}) {
  if (isStaticMode()) {
    const accounts = getLocalData<any[]>(ACCOUNTS_DB_KEY, []);
    const idx = accounts.findIndex(
      (a) => a.business_id === data.businessId && a.platform === data.platform
    );
    if (idx !== -1) {
      accounts[idx] = { ...accounts[idx], ...data, is_active: 1, platform_business_id: data.platformBusinessId };
    } else {
      accounts.push({
        id: `emu_acc_${Date.now()}`,
        business_id: data.businessId,
        platform: data.platform,
        platform_business_id: data.platformBusinessId,
        auth_token: data.authToken || "",
        is_active: 1,
        created_at: new Date().toISOString(),
      });
    }
    setLocalData(ACCOUNTS_DB_KEY, accounts);
    return { ok: true };
  }
  try {
    return await upsertConnectedAccount({ data: {
      businessId: data.businessId,
      platform: data.platform,
      platformBusinessId: data.platformBusinessId,
      authToken: data.authToken,
    } });
  } catch {
    return { ok: false, error: "Database offline" };
  }
}

export async function clientDisconnectAccount(accountId: string, businessId: string) {
  if (isStaticMode()) {
    const accounts = getLocalData<any[]>(ACCOUNTS_DB_KEY, []);
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx !== -1) {
      accounts[idx].is_active = 0;
      setLocalData(ACCOUNTS_DB_KEY, accounts);
    }
    return { ok: true };
  }
  try {
    return await disconnectAccount({ data: { accountId, businessId } });
  } catch {
    return { ok: false, error: "Database offline" };
  }
}

// ─── Preferences ─────────────────────────────────────────────────────────────

const PREFS_DB_KEY = "rp_emulator_preferences";

export async function clientGetPreferences(userId: string) {
  if (isStaticMode()) {
    const prefs = getLocalData<any>(PREFS_DB_KEY, null);
    if (!prefs || prefs.user_id !== userId) {
      return {
        user_id: userId,
        email_alerts: 1,
        daily_digest: 1,
        weekly_summary: 1,
        sms_alerts: 0,
        sms_phone: "",
      };
    }
    return prefs;
  }
  try {
    return await getPreferences({ data: { userId } });
  } catch {
    return {
      user_id: userId,
      email_alerts: 1,
      daily_digest: 1,
      weekly_summary: 1,
      sms_alerts: 0,
      sms_phone: "",
    };
  }
}

export async function clientUpdatePreferences(data: {
  userId: string;
  emailAlerts: boolean;
  dailyDigest: boolean;
  weeklySummary: boolean;
  smsAlerts: boolean;
  smsPhone: string;
}) {
  if (isStaticMode()) {
    const prefs = {
      user_id: data.userId,
      email_alerts: data.emailAlerts ? 1 : 0,
      daily_digest: data.dailyDigest ? 1 : 0,
      weekly_summary: data.weeklySummary ? 1 : 0,
      sms_alerts: data.smsAlerts ? 1 : 0,
      sms_phone: data.smsPhone,
    };
    setLocalData(PREFS_DB_KEY, prefs);
    return { ok: true };
  }
  try {
    return await updatePreferences({ data });
  } catch {
    return { ok: false, error: "Database offline" };
  }
}

// ─── Password Reset ──────────────────────────────────────────────────────────

export async function clientSendPasswordReset(email: string) {
  if (isStaticMode()) {
    console.log(`[Emulator] Password reset link for ${email}: http://localhost:3000/reset-password?token=emu_token_${Date.now()}`);
    return { ok: true, message: "If an account with that email exists, a reset link has been sent." };
  }
  try {
    return await sendPasswordReset({ data: { email } });
  } catch {
    return { ok: false, error: "Database offline" };
  }
}

export async function clientResetPassword(token: string, newPassword: string) {
  if (isStaticMode()) {
    return { ok: true };
  }
  try {
    return await resetPassword({ data: { token, newPassword } });
  } catch {
    return { ok: false, error: "Database offline" };
  }
}

// ─── Google OAuth ────────────────────────────────────────────────────────────

export async function clientGetGoogleOAuthUrl(businessId: string) {
  if (isStaticMode()) {
    return {
      ok: true,
      url: `http://localhost:3000/dashboard/settings?code=mock_oauth_code_123&state=google`,
    };
  }
  try {
    return await getGoogleOAuthUrl({ data: { businessId } });
  } catch {
    return { ok: false, error: "Database offline", url: null };
  }
}

export async function clientExchangeGoogleCode(code: string, businessId: string) {
  if (isStaticMode()) {
    // Save a mock connected account
    const result = await clientUpsertConnectedAccount({
      businessId,
      platform: "google",
      platformBusinessId: "accounts/mock-account/locations/mock-location",
      authToken: `mock_access_token_${Date.now()}`,
    });
    return { ok: result.ok };
  }
  try {
    return await exchangeGoogleCode({ data: { code, businessId } });
  } catch {
    return { ok: false, error: "Database offline" };
  }
}
