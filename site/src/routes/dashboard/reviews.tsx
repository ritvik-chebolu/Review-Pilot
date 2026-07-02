import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth-context";
import { clientGetReviews, clientUpdateReviewResponse, clientSaveReviewDraft, clientRejectReviewResponse } from "~/lib/api";
import { useState, useEffect } from "react";

export interface ReviewWithBusiness {
  id: string;
  business_id: string;
  platform: 'google' | 'yelp';
  platform_review_id: string | null;
  reviewer_name: string;
  rating: number;
  text: string;
  posted_at: string;
  responded_at: string | null;
  response_text: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  is_flagged: number;
  created_at: string;
  business_name: string;
}

export const Route = createFileRoute("/dashboard/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ReviewWithBusiness[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<Record<string, "success" | "error" | null>>({});

  // Redirect to login if not authenticated
  if (!auth.isLoading && !auth.user) {
    navigate({ to: "/login" });
    return null;
  }

  const loadReviews = async () => {
    if (!auth.user) return;
    setLoading(true);
    try {
      const result = await clientGetReviews(auth.user.id);
      setReviews(result.reviews as any);
      setTotal(result.total);

      // Initialize drafts dictionary
      const initialDrafts: Record<string, string> = {};
      result.reviews.forEach((r: any) => {
        if (!r.responded_at) {
          initialDrafts[r.id] = r.response_text || "";
        }
      });
      setDrafts(initialDrafts);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [auth.user]);

  const handleApprove = async (reviewId: string) => {
    if (!auth.user) return;
    const responseText = drafts[reviewId] ?? "";
    setSavingId(reviewId);
    try {
      const res = await clientUpdateReviewResponse(reviewId, responseText, auth.user.id);
      if (res.ok) {
        setSaveStatus((prev) => ({ ...prev, [reviewId]: "success" }));
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [reviewId]: null }));
          loadReviews();
        }, 1500);
      } else {
        setSaveStatus((prev) => ({ ...prev, [reviewId]: "error" }));
      }
    } catch (err) {
      setSaveStatus((prev) => ({ ...prev, [reviewId]: "error" }));
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveDraft = async (reviewId: string) => {
    if (!auth.user) return;
    const responseText = drafts[reviewId] ?? "";
    setSavingId(reviewId);
    try {
      const res = await clientSaveReviewDraft(reviewId, responseText, auth.user.id);
      if (res.ok) {
        setSaveStatus((prev) => ({ ...prev, [reviewId]: "success" }));
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [reviewId]: null }));
          loadReviews();
        }, 1500);
      } else {
        setSaveStatus((prev) => ({ ...prev, [reviewId]: "error" }));
      }
    } catch (err) {
      setSaveStatus((prev) => ({ ...prev, [reviewId]: "error" }));
    } finally {
      setSavingId(null);
    }
  };

  const handleReject = async (reviewId: string) => {
    if (!auth.user) return;
    setSavingId(reviewId);
    try {
      const res = await clientRejectReviewResponse(reviewId, auth.user.id);
      if (res.ok) {
        setSaveStatus((prev) => ({ ...prev, [reviewId]: "success" }));
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [reviewId]: null }));
          loadReviews();
        }, 1500);
      } else {
        setSaveStatus((prev) => ({ ...prev, [reviewId]: "error" }));
      }
    } catch (err) {
      setSaveStatus((prev) => ({ ...prev, [reviewId]: "error" }));
    } finally {
      setSavingId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <span className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-amber-400" : "text-gray-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
    );
  };

  const sentimentBadge = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: "bg-emerald-100 text-emerald-700",
      neutral: "bg-amber-100 text-amber-700",
      negative: "bg-red-100 text-red-700",
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${colors[sentiment] ?? "bg-gray-100 text-gray-700"}`}>
        {sentiment}
      </span>
    );
  };

  const platformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      google: "bg-blue-100 text-blue-700",
      yelp: "bg-red-100 text-red-700",
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${colors[platform] ?? "bg-gray-100 text-gray-700"}`}>
        {platform}
      </span>
    );
  };

  if (auth.isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Reviews</h1>
          <p className="text-sm text-gray-500">{total} total review{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {loading && reviews.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold">No reviews yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Reviews from connected platforms will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {/* Review header */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-gray-900">{review.reviewer_name}</span>
                {renderStars(review.rating)}
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">
                  {new Date(review.posted_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
                <span className="text-xs text-gray-400">·</span>
                {platformBadge(review.platform)}
                <span className="text-xs text-gray-400">·</span>
                {sentimentBadge(review.sentiment)}
                {review.is_flagged ? (
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    Flagged
                  </span>
                ) : null}
                <span className="ml-auto text-xs text-gray-400 font-semibold">{review.business_name}</span>
              </div>

              {/* Review text */}
              <p className="mt-3 text-sm leading-relaxed text-gray-700">{review.text}</p>

              {/* Response area */}
              {review.responded_at ? (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    <span className="text-xs font-semibold text-emerald-700">Response published</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">
                      {new Date(review.responded_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 italic bg-white p-3 rounded-lg border border-gray-100">{review.response_text}</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    AI-Drafted Response
                  </label>
                  <textarea
                    value={drafts[review.id] ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [review.id]: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Draft response manually..."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={savingId !== null}
                      className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingId === review.id ? "Processing..." : "Approve & post"}
                    </button>
                    <button
                      onClick={() => handleSaveDraft(review.id)}
                      disabled={savingId !== null}
                      className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      disabled={savingId !== null}
                      className="rounded-full border border-red-200 bg-white px-4 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>

                    {saveStatus[review.id] === "success" && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Saved
                      </span>
                    )}

                    {saveStatus[review.id] === "error" && (
                      <span className="text-xs text-red-600 font-semibold">
                        Error saving
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}