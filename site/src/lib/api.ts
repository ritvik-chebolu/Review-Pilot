import { serverLogin, serverSignup, serverGetMe } from "./server/auth-fns";
import { getBusiness, upsertBusiness } from "./server/business-fns";
import { getReviews, updateReviewResponse, saveReviewDraft, rejectReviewResponse } from "./server/review-fns";

export function isStaticMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname.endsWith("github.io") ||
    window.location.hostname.includes("localhost") === false && window.location.port !== "3000" ||
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
