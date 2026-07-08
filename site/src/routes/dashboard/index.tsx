import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth-context";
import { clientGetBusiness, clientGetReviews } from "~/lib/api";
import { useState, useEffect } from "react";

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  location: string;
  brand_voice: string;
  signature_style: string;
  custom_instructions: string;
  created_at: string;
}

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

export const Route = createFileRoute("/dashboard/")(  {
  component: OverviewPage,
});

function OverviewPage() {
  const auth = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<ReviewWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user) return;
    setLoading(true);
    Promise.all([
      clientGetBusiness(auth.user.id),
      clientGetReviews(auth.user.id),
    ])
      .then(([biz, revResult]) => {
        setBusiness(biz as any);
        setReviews((revResult?.reviews || []) as any);
      })
      .finally(() => setLoading(false));
  }, [auth.user]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" /></div>;
  }

  // Stats
  const totalReviews = reviews.length;
  const positiveReviews = reviews.filter((r) => r.sentiment === "positive").length;
  const negativeReviews = reviews.filter((r) => r.sentiment === "negative").length;
  const flaggedReviews = reviews.filter((r) => r.is_flagged).length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : "—";
  const respondedReviews = reviews.filter((r) => r.responded_at).length;
  const responseRate = totalReviews > 0 ? Math.round((respondedReviews / totalReviews) * 100) : 0;

  // Star Distribution
  const starCounts = [0, 0, 0, 0, 0]; // index 0 = 1-star, 4 = 5-star
  reviews.forEach((r) => {
    const starIdx = Math.max(1, Math.min(5, r.rating)) - 1;
    starCounts[starIdx]++;
  });
  const maxCount = Math.max(...starCounts, 1);

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">
          Welcome, {auth.user?.name?.split(" ")[0] ?? auth.user?.email ?? "there"}!
        </h1>
        {business && (
          <p className="mt-0.5 text-sm text-slate-500">{business.business_name}</p>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card glow-border rounded-xl p-5">
          <div className="text-sm font-medium text-slate-500">Total reviews</div>
          <div className="mt-1 text-3xl font-bold text-white">{totalReviews || "—"}</div>
        </div>
        <div className="glass-card glow-border rounded-xl p-5">
          <div className="text-sm font-medium text-slate-500">Average rating</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-3xl font-bold text-white">{avgRating}</span>
            {avgRating !== "—" && (
              <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
        </div>
        <div className="glass-card glow-border rounded-xl p-5">
          <div className="text-sm font-medium text-slate-500">Response rate</div>
          <div className="mt-1 text-3xl font-bold text-emerald-400">{responseRate}%</div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.06]">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${responseRate}%` }}
            />
          </div>
        </div>
        <div className="glass-card glow-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            Flagged
            {flaggedReviews > 0 && (
              <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-xs font-medium text-red-400">
                {flaggedReviews}
              </span>
            )}
          </div>
          <div className="mt-1 text-3xl font-bold text-red-400">{flaggedReviews || "0"}</div>
        </div>
      </div>

      {/* Setup prompt if no business configured */}
      {!business && (
        <div className="mt-8 glass-card rounded-xl border-2 border-dashed border-white/10 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/15">
            <svg className="h-8 w-8 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-white">Set up your business</h2>
          <p className="mt-2 text-slate-400">
            Configure your business profile and brand voice to start managing
            reviews with AI-powered responses.
          </p>
          <Link
            to="/dashboard/settings"
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            Go to settings
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      )}

      {/* Recent reviews & distribution chart grid */}
      {business && reviews.length > 0 && (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Recent reviews column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent reviews</h2>
              <Link to="/dashboard/reviews" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="glass-card glow-border rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/15 text-[10px] font-semibold text-indigo-300">
                      {review.reviewer_name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium text-white">{review.reviewer_name}</span>
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "text-amber-400" : "text-slate-700"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500">
                      {new Date(review.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {review.is_flagged ? (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">Flagged</span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{review.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution chart column */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Rating distribution</h2>
            <div className="glass-card glow-border rounded-xl p-6 space-y-4">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = starCounts[stars - 1];
                const percentage = Math.round((count / maxCount) * 100);
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex w-12 items-center gap-1.5 text-xs font-medium text-slate-400">
                      <span>{stars}</span>
                      <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="h-2 flex-1 rounded-full bg-white/[0.04]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-xs font-semibold text-slate-500">
                      {count}
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-white/[0.06] pt-4 mt-2">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Sentiment splits</span>
                  <div className="flex gap-2.5">
                    <span className="text-emerald-400">{positiveReviews} positive</span>
                    <span className="text-red-400">{negativeReviews} negative</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {business && reviews.length === 0 && (
        <div className="mt-8 glass-card rounded-xl border-2 border-dashed border-white/[0.08] p-10 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-white">No reviews yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Reviews from connected platforms will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}