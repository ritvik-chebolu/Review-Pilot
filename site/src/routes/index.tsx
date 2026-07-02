import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "~/lib/auth-context";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    // Simulate submission — in production this would call an API route
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-dvh">
      {/* ── Navigation ── */}
      <header className="fixed top-0 z-50 w-full border-b border-gray-100/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              RP
            </div>
            <span className="text-lg font-bold tracking-tight">ReviewPilot</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 sm:flex">
            <a href="#features" className="hover:text-gray-900">
              Features
            </a>
            <a href="#pricing" className="hover:text-gray-900">
              Pricing
            </a>
            {auth.user ? (
              <Link
                to="/dashboard"
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="hover:text-gray-900">
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
          {auth.user ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:hidden"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/signup"
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:hidden"
            >
              Get started
            </Link>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-indigo-50 blur-3xl" />
          <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-violet-50 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            AI-powered reputation management
          </span>

          <h1 className="mx-auto mt-8 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Never miss a review.
            <br />
            <span className="gradient-text">Respond in minutes, not days.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            ReviewPilot automatically monitors Google Business Profile and Yelp,
            drafts personalized on-brand responses with AI, and flags negative
            reviews for urgent human attention. All without logging into multiple
            platforms.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#waitlist"
              className="rounded-full bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200"
            >
              Get early access
            </a>
            <a
              href="#features"
              className="rounded-full border border-gray-300 px-8 py-3.5 text-base font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              See how it works
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Monitors Google &amp; Yelp
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              AI-drafted responses
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Negative review alerts
            </span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-t border-gray-100 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your online reputation, on autopilot
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Stop juggling tabs. ReviewPilot brings everything into one
              dashboard so you can focus on running your business.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Cross-platform monitoring</h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                ReviewPilot watches your Google Business Profile and Yelp pages
                around the clock. New reviews appear in your dashboard within
                minutes — no manual checking required.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold">AI-crafted responses</h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                Every review gets a personalized, on-brand reply drafted by AI.
                You review and approve with one click — or customize before
                posting. Sounds like you, not a robot.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Negative review alerts</h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                Low-rated reviews are flagged instantly and sent to your phone
                or email. You stay in control — ReviewPilot suggests a reply,
                but the final call is yours.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Weekly reputation summary</h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                Every Monday, get a clean email digest showing your new reviews,
                average rating trend, and response rates. Know how your
                reputation is tracking without opening a dashboard.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Respond in hours, not days</h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                Studies show 53% of customers expect a reply within 24 hours.
                ReviewPilot&apos;s median response time is under 4 hours — so
                you never leave a customer waiting.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Built for busy owners</h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                Dentists, plumbers, auto shops, therapists, law firms — we
                built ReviewPilot for people who are too busy running their
                business to chase reviews. Set it up in 5 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three simple steps to put your reputation on autopilot.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-600">
                1
              </div>
              <h3 className="mt-6 text-lg font-semibold">Connect your profiles</h3>
              <p className="mt-2 text-gray-600">
                Link your Google Business Profile and Yelp accounts. One-time
                setup, secure OAuth — we never store your passwords.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-600">
                2
              </div>
              <h3 className="mt-6 text-lg font-semibold">Set your brand voice</h3>
              <p className="mt-2 text-gray-600">
                Tell us your business name, location, and tone preferences.
                ReviewPilot learns your style and drafts replies that sound like
                you.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-600">
                3
              </div>
              <h3 className="mt-6 text-lg font-semibold">Relax and review</h3>
              <p className="mt-2 text-gray-600">
                New reviews land in your dashboard with AI-drafted replies.
                Approve in one click, or tweak and post. Negative? We alert you
                immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to manage your online reputation. No hidden
              fees, no long-term contracts.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* Starter */}
            <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold">Starter</h3>
              <p className="mt-1 text-sm text-gray-500">For solo operators</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">$9</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Up to 50 reviews / month</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Google + Yelp monitoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">AI-drafted responses</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Negative review alerts</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Weekly reputation summary</span>
                </li>
              </ul>
              <a
                href="#waitlist"
                className="mt-8 flex w-full items-center justify-center rounded-full border border-indigo-600 px-6 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                Get early access
              </a>
            </div>

            {/* Growth — featured */}
            <div className="relative rounded-2xl border-2 border-indigo-500 bg-white p-8 shadow-lg shadow-indigo-100">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                Most popular
              </span>
              <h3 className="text-lg font-semibold">Growth</h3>
              <p className="mt-1 text-sm text-gray-500">For growing businesses</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">$19</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Up to 200 reviews / month</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Google + Yelp monitoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">AI-drafted responses</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Negative review alerts (SMS + email)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Weekly reputation summary</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Custom brand voice settings</span>
                </li>
              </ul>
              <a
                href="#waitlist"
                className="mt-8 flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              >
                Get early access
              </a>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-1 text-sm text-gray-500">For multi-location teams</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">$29</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Unlimited reviews</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Google + Yelp monitoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">AI-drafted responses</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Multi-location support</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">Everything in Growth</span>
                </li>
              </ul>
              <a
                href="#waitlist"
                className="mt-8 flex w-full items-center justify-center rounded-full border border-indigo-600 px-6 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                Get early access
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Waitlist / Early Access ── */}
      <section id="waitlist" className="bg-indigo-600 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-6 text-center">
          {submitted ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                You&apos;re on the list!
              </h2>
              <p className="mt-4 text-lg text-indigo-100">
                Thanks for signing up. We&apos;ll let you know as soon as
                ReviewPilot is ready. In the meantime, we&apos;re hard at work
                building something great.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Get early access
              </h2>
              <p className="mt-4 text-lg text-indigo-100">
                Be one of the first to try ReviewPilot. Join the waitlist and
                we&apos;ll notify you when we launch.
              </p>
              <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
                <label htmlFor="email-input" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-input"
                  type="email"
                  required
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-full border-0 px-5 py-3.5 text-gray-900 shadow-sm ring-1 ring-white/20 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Join the waitlist"
                  )}
                </button>
              </form>
              <p className="mt-4 text-sm text-indigo-200">
                No spam. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              RP
            </div>
            <span className="text-sm font-semibold text-gray-700">ReviewPilot</span>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ReviewPilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}