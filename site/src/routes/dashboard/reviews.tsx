import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth-context";
import { clientGetReviews, clientUpdateReviewResponse, clientSaveReviewDraft, clientRejectReviewResponse } from "~/lib/api";
import { useState, useEffect, useCallback } from "react";

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

const PAGE_SIZE = 10;

function ReviewsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ReviewWithBusiness[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<Record<string, "success" | "error" | "copied" | null>>({});
  const [filter, setFilter] = useState<"all" | "flagged" | "pending" | "responded">("all");
  const [page, setPage] = useState(0);

  if (!auth.isLoading && !auth.user) {
    navigate({ to: "/login" });
    return null;
  }

  const loadReviews = useCallback(async () => {
    if (!auth.user) return;
    setLoading(true);
    try {
      const result = await clientGetReviews(auth.user.id);
      setReviews(result.reviews as any);
      setTotal(result.total);

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
  }, [auth.user]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
    } catch {
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
    } catch {
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
    } catch {
      setSaveStatus((prev) => ({ ...prev, [reviewId]: "error" }));
    } finally {
      setSavingId(null);
    }
  };

  /** Copy response to clipboard and show "Copied!" */
  const handleCopyForYelp = async (reviewId: string) => {
    const text = drafts[reviewId] ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setSaveStatus((prev) => ({ ...prev, [reviewId]: "copied" }));
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [reviewId]: null })), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setSaveStatus((prev) => ({ ...prev, [reviewId]: "copied" }));
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [reviewId]: null })), 2000);
    }
  };

  const renderStars = (rating: number) => (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? "text-amber-400" : "text-slate-700"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );

  const sentimentBadge = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: "bg-emerald-500/15 text-emerald-400",
      neutral: "bg-amber-500/15 text-amber-400",
      negative: "bg-red-500/15 text-red-400",
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${colors[sentiment] ?? "bg-slate-500/15 text-slate-400"}`}>
        {sentiment}
      </span>
    );
  };

  const platformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      google: "bg-blue-500/15 text-blue-400",
      yelp: "bg-red-500/15 text-red-400",
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${colors[platform] ?? "bg-slate-500/15 text-slate-400"}`}>
        {platform}
      </span>
    );
  };

  // Filter logic
  const filteredReviews = reviews.filter((r) => {
    if (filter === "flagged") return r.is_flagged;
    if (filter === "pending") return !r.responded_at;
    if (filter === "responded") return r.responded_at;
    return true;
  });

  const filterCounts = {
    all: reviews.length,
    flagged: reviews.filter((r) => r.is_flagged).length,
    pending: reviews.filter((r) => !r.responded_at).length,
    responded: reviews.filter((r) => r.responded_at).length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE);
  const paginatedReviews = filteredReviews.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filter changes
  useEffect(() => { setPage(0); }, [filter]);

  if (auth.isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" /></div>;
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Reviews</h1>
          <p className="text-sm text-slate-500">{total} total review{total !== 1 ? "s" : ""}</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
          {(["all", "pending", "flagged", "responded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {filterCounts[f] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  filter === f ? "bg-indigo-500/20 text-indigo-300" : "bg-white/[0.06] text-slate-500"
                }`}>
                  {filterCounts[f]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading && reviews.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="glass-card rounded-xl border-2 border-dashed border-white/[0.08] p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-white">
            {filter === "all" ? "No reviews yet" : `No ${filter} reviews`}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {filter === "all"
              ? "Reviews from connected platforms will appear here automatically."
              : "Try changing the filter above to see other reviews."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReviews.map((review) => (
            <div key={review.id} className="glass-card glow-border rounded-xl p-6">
              {/* Review header */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-300">
                  {review.reviewer_name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </div>
                <span className="font-medium text-white">{review.reviewer_name}</span>
                {renderStars(review.rating)}
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-500">
                  {new Date(review.posted_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
                <span className="text-xs text-slate-600">·</span>
                {platformBadge(review.platform)}
                <span className="text-xs text-slate-600">·</span>
                {sentimentBadge(review.sentiment)}
                {review.is_flagged ? (
                  <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    Flagged
                  </span>
                ) : null}
                <span className="ml-auto text-xs text-slate-600 font-semibold">{review.business_name}</span>
              </div>

              {/* Review text */}
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{review.text}</p>

              {/* Response area */}
              {review.responded_at ? (
                <div className="mt-4 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    <span className="text-xs font-semibold text-emerald-400">Response published</span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500">
                      {new Date(review.responded_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400 italic rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">{review.response_text}</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    AI-Drafted Response
                  </label>
                  <textarea
                    value={drafts[review.id] ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [review.id]: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Draft response manually..."
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Platform-specific primary action */}
                    {review.platform === "yelp" ? (
                      <>
                        <button
                          onClick={() => handleCopyForYelp(review.id)}
                          disabled={savingId !== null}
                          className="rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-red-500/20 transition hover:shadow-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {saveStatus[review.id] === "copied" ? "✓ Copied!" : "Copy response"}
                        </button>
                        <a
                          href={`https://www.yelp.com/biz/${review.platform_review_id?.split("_")[0] || ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-red-500/20 bg-red-500/[0.04] px-4 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/[0.08] flex items-center gap-1"
                        >
                          Open Yelp
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                      </>
                    ) : (
                      <button
                        onClick={() => handleApprove(review.id)}
                        disabled={savingId !== null}
                        className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingId === review.id ? "Posting..." : "Approve & post"}
                      </button>
                    )}
                    <button
                      onClick={() => handleSaveDraft(review.id)}
                      disabled={savingId !== null}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      disabled={savingId !== null}
                      className="rounded-full border border-red-500/20 bg-red-500/[0.04] px-4 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/[0.08] disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>

                    {saveStatus[review.id] === "success" && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Saved
                      </span>
                    )}

                    {saveStatus[review.id] === "error" && (
                      <span className="text-xs font-semibold text-red-400">Error saving</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}