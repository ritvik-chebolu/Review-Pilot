import { createServerFn } from "@tanstack/react-start";
import { teamDbExec } from "./team-db";

export interface Review {
  id: string;
  business_id: string;
  platform: string;
  platform_review_id: string | null;
  reviewer_name: string;
  rating: number;
  text: string;
  posted_at: string;
  responded_at: string | null;
  response_text: string | null;
  sentiment: string;
  is_flagged: number;
  created_at: string;
}

export interface ReviewWithBusiness extends Review {
  business_name: string;
}

interface PaginatedReviews {
  reviews: ReviewWithBusiness[];
  total: number;
}

export const getReviews = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { userId: string; limit?: number; offset?: number })
  .handler(async ({ data }): Promise<PaginatedReviews> => {
    const limit = data.limit ?? 50;
    const offset = data.offset ?? 0;
    const escapedUserId = JSON.stringify(data.userId);

    // Get total count
    const countResult = teamDbExec(
      `SELECT COUNT(*) as total FROM reviews r JOIN businesses b ON r.business_id = b.id WHERE b.user_id = ${escapedUserId}`
    ) as { total: number }[];
    const total = countResult?.[0]?.total ?? 0;

    // Get reviews with business name
    const result = teamDbExec(
      `SELECT r.*, b.business_name FROM reviews r JOIN businesses b ON r.business_id = b.id WHERE b.user_id = ${escapedUserId} ORDER BY r.posted_at DESC LIMIT ${limit} OFFSET ${offset}`
    ) as Record<string, unknown>[];

    return {
      reviews: (result ?? []) as unknown as ReviewWithBusiness[],
      total,
    };
  });

export const updateReviewResponse = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { reviewId: string; responseText: string; userId: string })
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const escapedReviewId = JSON.stringify(data.reviewId);
    const escapedResponseText = JSON.stringify(data.responseText);
    const escapedUserId = JSON.stringify(data.userId);

    // Verify the review belongs to this user
    const reviewCheck = teamDbExec(
      `SELECT r.id FROM reviews r JOIN businesses b ON r.business_id = b.id WHERE r.id = ${escapedReviewId} AND b.user_id = ${escapedUserId}`
    ) as { id: string }[];
    if (!reviewCheck || reviewCheck.length === 0) {
      return { ok: false, error: "Review not found or access denied" };
    }

    teamDbExec(
      `UPDATE reviews SET response_text = ${escapedResponseText}, responded_at = datetime('now') WHERE id = ${escapedReviewId}`
    );
    return { ok: true };
  });

export const getBusinesses = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { userId: string })
  .handler(async ({ data }): Promise<{ id: string; business_name: string }[]> => {
    const escapedUserId = JSON.stringify(data.userId);
    const result = teamDbExec(
      `SELECT id, business_name FROM businesses WHERE user_id = ${escapedUserId} ORDER BY created_at DESC`
    ) as { id: string; business_name: string }[];
    return result ?? [];
  });

export const saveReviewDraft = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { reviewId: string; responseText: string; userId: string })
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const escapedReviewId = JSON.stringify(data.reviewId);
    const escapedResponseText = JSON.stringify(data.responseText);
    const escapedUserId = JSON.stringify(data.userId);

    // Verify ownership
    const reviewCheck = teamDbExec(
      `SELECT r.id FROM reviews r JOIN businesses b ON r.business_id = b.id WHERE r.id = ${escapedReviewId} AND b.user_id = ${escapedUserId}`
    ) as { id: string }[];
    if (!reviewCheck || reviewCheck.length === 0) {
      return { ok: false, error: "Review not found or access denied" };
    }

    teamDbExec(
      `UPDATE reviews SET response_text = ${escapedResponseText} WHERE id = ${escapedReviewId}`
    );
    return { ok: true };
  });

export const rejectReviewResponse = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { reviewId: string; userId: string })
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const escapedReviewId = JSON.stringify(data.reviewId);
    const escapedUserId = JSON.stringify(data.userId);

    // Verify ownership
    const reviewCheck = teamDbExec(
      `SELECT r.id FROM reviews r JOIN businesses b ON r.business_id = b.id WHERE r.id = ${escapedReviewId} AND b.user_id = ${escapedUserId}`
    ) as { id: string }[];
    if (!reviewCheck || reviewCheck.length === 0) {
      return { ok: false, error: "Review not found or access denied" };
    }

    teamDbExec(
      `UPDATE reviews SET response_text = NULL, responded_at = NULL WHERE id = ${escapedReviewId}`
    );
    return { ok: true };
  });