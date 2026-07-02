import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/dashboard/")({
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
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>;
  }

  // Stats
  const totalReviews = reviews.length;
  const positiveReviews = reviews.filter((r) => r.sentiment === "positive").length;
  const negativeReviews = reviews.filter((r) => r.sentiment === "negative").length;
  const flaggedReviews = reviews.filter((r) => r.is_flagged).length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : "—";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">
          Welcome, {auth.user?.name?.split(" ")[0] ?? auth.user?.email ?? "there"}!
        </h1>
        {business && (
          <p className="mt-0.5 text-sm text-gray-500">{business.business_name}</p>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Total reviews</div>
          <div className="mt-1 text-3xl font-bold">{totalReviews || "—"}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Average rating</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-3xl font-bold">{avgRating}</span>
            {avgRating !== "—" && (
              <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Positive reviews</div>
          <div className="mt-1 text-3xl font-bold text-emerald-600">{positiveReviews || "—"}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            Flagged
            {flaggedReviews > 0 && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                {flaggedReviews}
              </span>
            )}
          </div>
          <div className="mt-1 text-3xl font-bold text-red-600">{flaggedReviews || "0"}</div>
        </div>
      </div>

      {/* Setup prompt if no business configured */}
      {!business && (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 bg-white p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold">Set up your business</h2>
          <p className="mt-2 text-gray-600">
            Configure your business profile and brand voice to start managing
            reviews with AI-powered responses.
          </p>
          <a
            href="/dashboard/settings"
            className="mt-6 inline-flex items-center rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Go to settings
          </a>
        </div>
      )}

      {/* Recent reviews */}
      {business && reviews.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent reviews</h2>
            <a href="/dashboard/reviews" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all
            </a>
          </div>
          <div className="space-y-3">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{review.reviewer_name}</span>
                  <span className="text-xs text-gray-400">
                    {review.rating}/5
                  </span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">
                    {new Date(review.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  {review.is_flagged && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Flagged</span>
                  )}
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-gray-600">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {business && reviews.length === 0 && (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold">No reviews yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Reviews from connected platforms will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}