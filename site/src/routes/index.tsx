import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "~/lib/auth-context";

export const Route = createFileRoute("/")(  {
  component: Home,
});

/* ── Icon Components ── */
const CheckIcon = () => (
  <svg className="h-5 w-5 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const StarIcon = ({ filled = true }: { filled?: boolean }) => (
  <svg className={`h-4 w-4 ${filled ? "text-amber-400" : "text-slate-600"}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

/* ── Data ── */
const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Cross-platform monitoring",
    description: "ReviewPilot watches your Google Business Profile and Yelp pages around the clock. New reviews appear in your dashboard within minutes.",
    color: "from-indigo-500/20 to-indigo-500/5",
    iconBg: "bg-indigo-500/15 text-indigo-400",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "AI-crafted responses",
    description: "Every review gets a personalized, on-brand reply drafted by AI. Approve with one click — or customize before posting.",
    color: "from-violet-500/20 to-violet-500/5",
    iconBg: "bg-violet-500/15 text-violet-400",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
    title: "Negative review alerts",
    description: "Low-rated reviews are flagged instantly and sent to your phone or email. You stay in control — the final call is always yours.",
    color: "from-rose-500/20 to-rose-500/5",
    iconBg: "bg-rose-500/15 text-rose-400",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    title: "Weekly reputation summary",
    description: "Every Monday, get a clean email digest showing your new reviews, average rating trend, and response rates.",
    color: "from-emerald-500/20 to-emerald-500/5",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Respond in hours, not days",
    description: "53% of customers expect a reply within 24 hours. ReviewPilot's median response time is under 4 hours.",
    color: "from-amber-500/20 to-amber-500/5",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Built for busy owners",
    description: "Dentists, plumbers, auto shops, therapists, law firms — set it up in 5 minutes and forget about it.",
    color: "from-sky-500/20 to-sky-500/5",
    iconBg: "bg-sky-500/15 text-sky-400",
  },
];

const PLANS = [
  {
    name: "Starter",
    subtitle: "For solo operators",
    price: "Free",
    suffix: "during beta trial",
    featured: true,
    comingSoon: false,
    features: [
      "Up to 50 reviews / month",
      "Google + Yelp monitoring",
      "AI-drafted responses",
      "Negative review alerts",
      "Weekly reputation summary",
    ],
  },
  {
    name: "Growth",
    subtitle: "For growing businesses",
    price: "$19",
    featured: false,
    comingSoon: true,
    features: [
      "Up to 200 reviews / month",
      "Google + Yelp monitoring",
      "AI-drafted responses",
      "Negative review alerts (SMS + email)",
      "Weekly reputation summary",
      "Custom brand voice settings",
    ],
  },
  {
    name: "Pro",
    subtitle: "For multi-location teams",
    price: "$29",
    featured: false,
    comingSoon: true,
    features: [
      "Unlimited reviews",
      "Google + Yelp monitoring",
      "AI-drafted responses",
      "Multi-location support",
      "Priority support",
      "Everything in Growth",
    ],
  },
];

const TESTIMONIALS = [
  {
    name: "Dr. Sarah Kim",
    role: "Smile Studio Dental",
    text: "ReviewPilot saves me 5+ hours every week. The AI responses sound exactly like something I'd write — warm, personal, and professional.",
    rating: 5,
    avatar: "SK",
  },
  {
    name: "Marcus Greene",
    role: "Greene's Auto Repair",
    text: "We went from a 3.8 to a 4.6 star average in three months. The instant alerts on negative reviews let us fix problems before they escalate.",
    rating: 5,
    avatar: "MG",
  },
  {
    name: "Priya Patel",
    role: "Clarity Law Group",
    text: "As an attorney, every word matters. ReviewPilot's formal tone setting and custom instructions give me confidence in every reply.",
    rating: 5,
    avatar: "PP",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Connect your profiles",
    description: "Link your Google Business Profile and Yelp accounts. One-time setup, secure OAuth — we never store your passwords.",
  },
  {
    number: "02",
    title: "Set your brand voice",
    description: "Tell us your business name, tone preferences, and any custom rules. ReviewPilot learns your style.",
  },
  {
    number: "03",
    title: "Relax and review",
    description: "New reviews land in your dashboard with AI-drafted replies. Approve in one click, or tweak and post.",
  },
];

/* ── Component ── */
function Home() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-dvh bg-[#0b0d11] text-slate-100">
      {/* ── Navigation ── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#0b0d11]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-lg shadow-indigo-500/20">
              RP
            </div>
            <span className="text-lg font-bold tracking-tight">ReviewPilot</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 sm:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            {auth.user ? (
              <Link
                to="/dashboard"
                className="btn-primary"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="transition hover:text-white">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </nav>
          {/* Mobile CTA */}
          {auth.user ? (
            <Link to="/dashboard" className="btn-primary sm:hidden">
              Dashboard
            </Link>
          ) : (
            <Link to="/signup" className="btn-primary sm:hidden">
              Get started
            </Link>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32">
        {/* Ambient background glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-60 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/8 blur-[120px]" />
          <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-violet-600/6 blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-sky-600/5 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="pill animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI-powered reputation management
          </span>

          <h1 className="mx-auto mt-8 max-w-4xl text-4xl font-extrabold tracking-tight leading-[1.1] animate-fade-up delay-100 sm:text-5xl md:text-6xl lg:text-7xl">
            Never miss a review.
            <br />
            <span className="gradient-text">Respond in minutes,</span>
            <br />
            <span className="gradient-text">not days.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-400 animate-fade-up delay-200 sm:text-xl">
            ReviewPilot automatically monitors Google Business Profile and Yelp,
            drafts personalized on-brand responses with AI, and flags negative
            reviews for urgent human attention.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-up delay-300">
            <a href="#waitlist" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base">
              Get early access
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a href="#features" className="btn-secondary inline-flex items-center gap-2 px-8 py-4 text-base">
              See how it works
            </a>
          </div>

          {/* Social proof badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500 animate-fade-up delay-400">
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Monitors Google &amp; Yelp
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              AI-drafted responses
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Under 4-hour response time
            </span>
          </div>
        </div>

        {/* ── Live Demo Preview Card ── */}
        <div className="mx-auto mt-20 max-w-4xl px-6 animate-fade-up delay-500">
          <div className="glass-card rounded-2xl p-1 shadow-2xl shadow-indigo-500/5">
            <div className="rounded-xl bg-surface-1 p-6">
              {/* Mini dashboard header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                    RP
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Downtown Dental</div>
                    <div className="text-xs text-slate-500">3 new reviews today</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-medium text-emerald-400">4.7 ★ avg</span>
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-1 font-medium text-amber-400">127 reviews</span>
                </div>
              </div>

              {/* Sample review card */}
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-300">
                    JD
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Jane D.</span>
                      <span className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <StarIcon key={i} filled={i <= 5} />
                        ))}
                      </span>
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-400">Google</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                      Absolutely fantastic experience. Dr. Miller explained everything clearly and the office was spotless. Highly recommend!
                    </p>
                  </div>
                </div>
                {/* AI Draft */}
                <div className="mt-4 rounded-lg border border-indigo-500/20 bg-indigo-500/[0.04] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    AI-DRAFTED RESPONSE
                  </div>
                  <p className="mt-2 text-sm italic leading-relaxed text-slate-400">
                    "Thank you so much for the kind words, Jane! We're thrilled you had such a comfortable visit. Dr. Miller takes great pride in making sure patients feel informed and at ease. We look forward to seeing you at your next appointment!"
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-400">
                      Approve &amp; post
                    </button>
                    <button className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.04]">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-t border-white/[0.04] py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your online reputation, <span className="gradient-text">on autopilot</span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Stop juggling tabs. ReviewPilot brings everything into one
              dashboard so you can focus on running your business.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className={`group glass-card glow-border rounded-2xl p-7 transition-all duration-300 animate-fade-up delay-${(i + 1) * 100}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-t border-white/[0.04] bg-surface-1/50 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to <span className="gradient-text">autopilot</span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Get up and running in less than five minutes.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={i} className="group text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl font-bold text-indigo-400 border border-indigo-500/20 transition-all duration-300 group-hover:bg-indigo-500/20 group-hover:scale-105 animate-pulse-glow">
                  {step.number}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="border-t border-white/[0.04] py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by <span className="gradient-text">local businesses</span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Hear from owners who put their reputation on autopilot.
            </p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="glass-card glow-border rounded-2xl p-7">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} filled={star <= t.rating} />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  "{t.text}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-xs font-bold text-indigo-300">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-white/[0.04] bg-surface-1/50 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, <span className="gradient-text">transparent pricing</span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Everything you need to manage your online reputation. No hidden
              fees, no long-term contracts.
            </p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${
                  plan.featured
                    ? "border-2 border-indigo-500/40 bg-indigo-500/[0.06] shadow-lg shadow-indigo-500/10"
                    : "glass-card glow-border"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-lg shadow-indigo-500/30">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.subtitle}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-white">{plan.price}</span>
                  <span className="text-slate-500">{plan.comingSoon ? "/month" : (plan.suffix ? ` ${plan.suffix}` : "/month")}</span>
                </div>
                <ul className="mt-8 space-y-3.5">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.comingSoon ? (
                  <button
                    disabled
                    className="mt-8 flex w-full items-center justify-center rounded-full border border-white/5 bg-white/[0.01] px-6 py-3 text-sm font-semibold text-slate-600 cursor-not-allowed"
                  >
                    Coming soon
                  </button>
                ) : (
                  <a
                    href="#waitlist"
                    className={`mt-8 flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
                      plan.featured
                        ? "btn-primary"
                        : "border border-white/10 text-white hover:bg-white/[0.04] hover:border-white/20"
                    }`}
                  >
                    Get early access
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Waitlist / CTA ── */}
      <section id="waitlist" className="border-t border-white/[0.04] py-24 sm:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          {submitted ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 animate-pulse-glow">
                <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                You&apos;re on the list!
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Thanks for signing up. We&apos;ll let you know as soon as
                ReviewPilot is ready. We&apos;re building something great.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Get <span className="gradient-text">early access</span>
              </h2>
              <p className="mt-4 text-lg text-slate-400">
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
                  className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 disabled:cursor-not-allowed disabled:opacity-70"
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
              <p className="mt-4 text-sm text-slate-600">
                No spam. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
              RP
            </div>
            <span className="text-sm font-semibold text-slate-300">ReviewPilot</span>
          </div>
          <p className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} ReviewPilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}