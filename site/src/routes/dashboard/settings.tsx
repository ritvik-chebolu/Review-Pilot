import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from "~/lib/auth-context";
import {
  clientGetBusiness,
  clientUpsertBusiness,
  clientGetConnectedAccounts,
  clientUpsertConnectedAccount,
  clientDisconnectAccount,
  clientGetPreferences,
  clientUpdatePreferences,
  clientGetGoogleOAuthUrl,
  clientExchangeGoogleCode,
} from "~/lib/api";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

/* ── Types ── */
interface ConnectedAccount {
  id: string;
  platform: "google" | "yelp";
  platform_business_id: string;
  is_active: number;
  created_at: string;
}

/* ── Constants ── */
const BUSINESS_TYPES = [
  { value: "", label: "Select your business type" },
  { value: "auto", label: "Auto Repair Shop" },
  { value: "dental", label: "Dental Clinic" },
  { value: "plumbing", label: "Plumbing Service" },
  { value: "hvac", label: "HVAC Company" },
  { value: "therapist", label: "Therapy Practice" },
  { value: "law", label: "Law Firm" },
  { value: "medical", label: "Medical Practice" },
  { value: "salon", label: "Salon / Spa" },
  { value: "restaurant", label: "Restaurant" },
  { value: "cleaning", label: "Cleaning Service" },
  { value: "landscaping", label: "Landscaping" },
  { value: "other", label: "Other" },
];

const BRAND_VOICES = [
  { value: "professional", label: "Professional", desc: "Clear, polished, and authoritative" },
  { value: "warm", label: "Warm & Friendly", desc: "Personal, caring, and approachable" },
  { value: "casual", label: "Casual", desc: "Relaxed, conversational, and easy-going" },
  { value: "family-oriented", label: "Family-Oriented", desc: "Welcoming, wholesome, and community-focused" },
  { value: "formal", label: "Formal", desc: "Courteous, structured, and respectful" },
];

const SIGNATURE_STYLES = [
  { value: "business-name", label: "Business name", example: "~ Acme Plumbing" },
  { value: "first-person", label: "First person", example: "~ John" },
  { value: "we", label: "We", example: "~ The Acme Team" },
];

const TABS = ["Profile", "Brand Voice", "Connections", "Notifications"] as const;
type Tab = (typeof TABS)[number];

/* ── Main Component ── */
function SettingsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("Profile");

  /* Business state */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [businessId, setBusinessId] = useState<string | undefined>();
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [brandVoice, setBrandVoice] = useState("professional");
  const [signatureStyle, setSignatureStyle] = useState("business-name");
  const [customInstructions, setCustomInstructions] = useState("");

  /* Connected accounts state */
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<"google" | "yelp" | null>(null);
  const [connectId, setConnectId] = useState("");
  const [connectToken, setConnectToken] = useState("");
  const [connectSaving, setConnectSaving] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [connectSuccess, setConnectSuccess] = useState("");

  /* Notifications preferences state */
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);

  // Redirect to login if not authenticated
  if (!auth.isLoading && !auth.user) {
    navigate({ to: "/login" });
    return null;
  }

  useEffect(() => {
    if (!auth.user) return;
    setLoading(true);

    Promise.all([
      clientGetBusiness(auth.user.id),
      clientGetPreferences(auth.user.id),
    ])
      .then(async ([biz, prefs]) => {
        if (biz) {
          setBusinessId(biz.id);
          setBusinessName(biz.business_name);
          setBusinessType(biz.business_type);
          setLocation(biz.location);
          setBrandVoice(biz.brand_voice);
          setSignatureStyle(biz.signature_style);
          setCustomInstructions(biz.custom_instructions);

          const accs = await clientGetConnectedAccounts(biz.id);
          setAccounts((accs || []) as ConnectedAccount[]);
        }

        if (prefs) {
          setEmailAlerts(prefs.email_alerts === 1);
          setDailyDigest(prefs.daily_digest === 1);
          setWeeklySummary(prefs.weekly_summary === 1);
          setSmsAlerts(prefs.sms_alerts === 1);
          setSmsPhone(prefs.sms_phone || "");
        }
      })
      .finally(() => setLoading(false));
  }, [auth.user]);

  // Handle Google OAuth callback on mount
  useEffect(() => {
    if (typeof window === "undefined" || !businessId) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      // Clear query params so we don't exchange twice
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setConnectingPlatform("google");
      setConnectSaving(true);
      setConnectError("");
      setConnectSuccess("");
      
      clientExchangeGoogleCode(code, businessId)
        .then((result) => {
          if (result.ok) {
            setConnectSuccess("Google Business Profile successfully connected!");
            clientGetConnectedAccounts(businessId).then(setAccounts as any);
          } else {
            setConnectError((result as any).error || "Failed to exchange authorization code.");
          }
        })
        .catch(() => {
          setConnectError("An error occurred during Google connection.");
        })
        .finally(() => {
          setConnectSaving(false);
          setConnectingPlatform(null);
        });
    }
  }, [businessId]);

  const handleGoogleOAuthStart = async () => {
    if (!businessId) return;
    setConnectError("");
    setConnectSuccess("");
    try {
      const res = await clientGetGoogleOAuthUrl(businessId);
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        setConnectError(res.error || "Could not start Google auth.");
      }
    } catch {
      setConnectError("Failed to initiate Google OAuth.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.user) return;
    setSaving(true);
    setSaved(false);
    const result = await clientUpsertBusiness({
      userId: auth.user.id,
      businessId,
      business_name: businessName,
      business_type: businessType,
      location,
      brand_voice: brandVoice,
      signature_style: signatureStyle,
      custom_instructions: customInstructions,
    });
    setSaving(false);
    if (result.ok) {
      setBusinessId(result.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.user) return;
    setSavingPrefs(true);
    setSavedPrefs(false);
    const result = await clientUpdatePreferences({
      userId: auth.user.id,
      emailAlerts,
      dailyDigest,
      weeklySummary,
      smsAlerts,
      smsPhone,
    });
    setSavingPrefs(false);
    if (result.ok) {
      setSavedPrefs(true);
      setTimeout(() => setSavedPrefs(false), 3000);
    }
  };

  const handleConnect = async () => {
    if (!businessId || !connectingPlatform || !connectId.trim()) return;
    setConnectError("");
    setConnectSuccess("");
    setConnectSaving(true);
    const result = await clientUpsertConnectedAccount({
      businessId,
      platform: connectingPlatform,
      platformBusinessId: connectId.trim(),
      authToken: connectToken.trim() || undefined,
    });
    setConnectSaving(false);
    if ((result as any).ok) {
      setConnectSuccess(`${connectingPlatform === "google" ? "Google Business Profile" : "Yelp"} connected!`);
      setConnectId("");
      setConnectToken("");
      setConnectingPlatform(null);
      // Refresh accounts
      const accs = await clientGetConnectedAccounts(businessId);
      setAccounts((accs || []) as ConnectedAccount[]);
    } else {
      setConnectError((result as any).error || "Failed to connect account");
    }
  };

  const handleDisconnect = async (account: ConnectedAccount) => {
    if (!businessId) return;
    await clientDisconnectAccount(account.id, businessId);
    const accs = await clientGetConnectedAccounts(businessId);
    setAccounts((accs || []) as ConnectedAccount[]);
  };

  if (auth.isLoading || loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" /></div>;
  }

  const activeAccounts = accounts.filter((a) => a.is_active);

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500">Manage your business profile, brand voice, and connected accounts.</p>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              activeTab === tab
                ? "bg-indigo-500/15 text-indigo-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
            {tab === "Connections" && activeAccounts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                {activeAccounts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === "Profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-base font-semibold text-white">Business Information</h2>
            <p className="mt-1 text-sm text-slate-500">Used to personalize your AI review responses.</p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-slate-300">
                  Business name
                </label>
                <input
                  id="businessName"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Acme Plumbing"
                  className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-slate-300">
                  Business type
                </label>
                <select
                  id="businessType"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-white/10 bg-[#1a1e28] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-[#1a1e28]">{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="location" className="block text-sm font-medium text-slate-300">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Portland, OR"
                  className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving || !businessName.trim()}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 animate-fade-in">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </form>
      )}

      {/* ── Brand Voice Tab ── */}
      {activeTab === "Brand Voice" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-base font-semibold text-white">Brand Voice</h2>
            <p className="mt-1 text-sm text-slate-500">Control how ReviewPilot sounds when responding on your behalf.</p>

            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Tone</label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {BRAND_VOICES.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => setBrandVoice(v.value)}
                      className={`group rounded-lg border p-4 text-left transition ${
                        brandVoice === v.value
                          ? "border-indigo-500/40 bg-indigo-500/[0.08]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className={`text-sm font-semibold ${brandVoice === v.value ? "text-indigo-400" : "text-white"}`}>{v.label}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Signature style</label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {SIGNATURE_STYLES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSignatureStyle(s.value)}
                      className={`group rounded-lg border p-4 text-left transition ${
                        signatureStyle === s.value
                          ? "border-indigo-500/40 bg-indigo-500/[0.08]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className={`text-sm font-semibold ${signatureStyle === s.value ? "text-indigo-400" : "text-white"}`}>{s.label}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{s.example}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="customInstructions" className="block text-sm font-medium text-slate-300">
                  Custom instructions
                </label>
                <textarea
                  id="customInstructions"
                  rows={4}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="E.g. Always mention our 24/7 emergency service. Never make promises about pricing without approval."
                  className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="mt-1.5 text-xs text-slate-600">
                  These rules are given to the AI whenever it drafts a response for your reviews.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving || !businessName.trim()}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save brand voice"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 animate-fade-in">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </form>
      )}

      {/* ── Connections Tab ── */}
      {activeTab === "Connections" && (
        <div className="space-y-6">
          {!businessId && (
            <div className="glass-card rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
              <p className="text-sm text-amber-400">
                Please set up your business profile first before connecting accounts.
              </p>
            </div>
          )}

          {/* Google Business Profile card */}
          <PlatformCard
            platform="google"
            connected={activeAccounts.filter((a) => a.platform === "google")}
            onConnect={() => { setConnectingPlatform("google"); setConnectId(""); setConnectToken(""); setConnectError(""); setConnectSuccess(""); }}
            onDisconnect={handleDisconnect}
            disabled={!businessId}
          />

          {/* Yelp card */}
          <PlatformCard
            platform="yelp"
            connected={activeAccounts.filter((a) => a.platform === "yelp")}
            onConnect={() => { setConnectingPlatform("yelp"); setConnectId(""); setConnectToken(""); setConnectError(""); setConnectSuccess(""); }}
            onDisconnect={handleDisconnect}
            disabled={!businessId}
          />

          {/* Connect modal / inline form */}
          {connectingPlatform && (
            <div className="glass-card rounded-xl border border-indigo-500/20 p-6">
              <h3 className="text-base font-semibold text-white">
                Connect {connectingPlatform === "google" ? "Google Business Profile" : "Yelp Business"}
              </h3>

              {connectingPlatform === "google" ? (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-400">
                    Connect automatically using your Google account (recommended), or switch to manual developer setup.
                  </p>
                  
                  <button
                    type="button"
                    onClick={handleGoogleOAuthStart}
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    <span>Sign in with Google</span>
                  </button>

                  <div className="border-t border-white/[0.06] pt-4 mt-6">
                    <details className="group">
                      <summary className="text-xs font-semibold text-indigo-400 cursor-pointer list-none flex items-center justify-between hover:text-indigo-300">
                        <span>Developer Mode (Manual Setup)</span>
                        <span className="transition-transform group-open:rotate-180">▼</span>
                      </summary>
                      <div className="mt-4 space-y-4 animate-fade-in">
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-xs font-mono text-slate-400">
                          Format: <span className="text-indigo-300">accounts/&#123;accountId&#125;/locations/&#123;locationId&#125;</span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300">Location path</label>
                          <input
                            type="text"
                            value={connectId}
                            onChange={(e) => setConnectId(e.target.value)}
                            placeholder="accounts/123456789/locations/987654321"
                            className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300">OAuth access token</label>
                          <input
                            type="password"
                            value={connectToken}
                            onChange={(e) => setConnectToken(e.target.value)}
                            placeholder="ya29.a0AS..."
                            className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-400">
                    Enter your Yelp business alias or ID and your Yelp API key. You can get an API key from the <span className="text-indigo-400">Yelp Fusion Developer Portal</span>.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Business alias or ID</label>
                    <input
                      type="text"
                      value={connectId}
                      onChange={(e) => setConnectId(e.target.value)}
                      placeholder="downtown-dental-portland"
                      className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <p className="mt-1 text-xs text-slate-600">
                      Found in your Yelp business URL: yelp.com/biz/<span className="text-slate-400">business-alias</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Yelp API key</label>
                    <input
                      type="password"
                      value={connectToken}
                      onChange={(e) => setConnectToken(e.target.value)}
                      placeholder="your-yelp-api-key"
                      className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              )}

              {connectError && (
                <p className="mt-3 text-sm font-medium text-red-400">{connectError}</p>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connectSaving || !connectId.trim()}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {connectSaving ? "Connecting..." : "Connect"}
                </button>
                <button
                  type="button"
                  onClick={() => setConnectingPlatform(null)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {connectSuccess && !connectingPlatform && (
            <div className="glass-card rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <p className="text-sm font-medium text-emerald-400">{connectSuccess}</p>
            </div>
          )}

          {/* Info box */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h4 className="text-sm font-semibold text-slate-300">How it works</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-indigo-500/20 text-center text-[10px] font-bold leading-4 text-indigo-400">G</span>
                <span><strong className="text-slate-400">Google</strong> — ReviewPilot polls your Google Business Profile reviews every 30 minutes and can post replies directly via the API.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-red-500/20 text-center text-[10px] font-bold leading-4 text-red-400">Y</span>
                <span><strong className="text-slate-400">Yelp</strong> — Yelp does not have a public reply API, so ReviewPilot drafts your response and sends it to your email. You copy and paste it directly into Yelp.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Notifications Tab ── */}
      {activeTab === "Notifications" && (
        <form onSubmit={handleSavePreferences} className="space-y-6 animate-fade-in">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-base font-semibold text-white">Alert Preferences</h2>
            <p className="mt-1 text-sm text-slate-500">Configure how and when you receive review alerts and summaries.</p>

            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3">
                <input
                  id="emailAlerts"
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/10 bg-white/[0.04] text-indigo-500 focus:ring-indigo-500/20"
                />
                <div>
                  <label htmlFor="emailAlerts" className="block text-sm font-medium text-white">
                    Immediate Email Alerts
                  </label>
                  <p className="text-xs text-slate-500">
                    Get an email notification instantly when a low-rated review (1-2 stars) is received.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-white/[0.06] pt-5">
                <input
                  id="dailyDigest"
                  type="checkbox"
                  checked={dailyDigest}
                  onChange={(e) => setDailyDigest(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/10 bg-white/[0.04] text-indigo-500 focus:ring-indigo-500/20"
                />
                <div>
                  <label htmlFor="dailyDigest" className="block text-sm font-medium text-white">
                    Daily Digest Emails
                  </label>
                  <p className="text-xs text-slate-500">
                    Receive a consolidated email summary of all new reviews received every 24 hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-white/[0.06] pt-5">
                <input
                  id="weeklySummary"
                  type="checkbox"
                  checked={weeklySummary}
                  onChange={(e) => setWeeklySummary(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/10 bg-white/[0.04] text-indigo-500 focus:ring-indigo-500/20"
                />
                <div>
                  <label htmlFor="weeklySummary" className="block text-sm font-medium text-white">
                    Weekly Reputation Report
                  </label>
                  <p className="text-xs text-slate-500">
                    Receive a weekly metrics report summarizing rating trends and review responses.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-white/[0.06] pt-5">
                <input
                  id="smsAlerts"
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/10 bg-white/[0.04] text-indigo-500 focus:ring-indigo-500/20"
                />
                <div className="flex-1">
                  <label htmlFor="smsAlerts" className="block text-sm font-medium text-white">
                    SMS Alerts (Coming Soon)
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Get text alerts for negative reviews on your mobile phone.
                  </p>
                  {smsAlerts && (
                    <div className="animate-fade-in max-w-sm">
                      <label htmlFor="smsPhone" className="block text-xs font-medium text-slate-400">Mobile phone number</label>
                      <input
                        id="smsPhone"
                        type="tel"
                        disabled
                        value={smsPhone}
                        onChange={(e) => setSmsPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="mt-1 block w-full rounded-lg border border-white/5 bg-white/[0.01] px-4 py-2 text-xs text-slate-500 cursor-not-allowed placeholder:text-slate-700"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={savingPrefs}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPrefs ? "Saving..." : "Save preferences"}
            </button>
            {savedPrefs && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 animate-fade-in">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

/* ── Platform Card subcomponent ── */
function PlatformCard({
  platform,
  connected,
  onConnect,
  onDisconnect,
  disabled,
}: {
  platform: "google" | "yelp";
  connected: ConnectedAccount[];
  onConnect: () => void;
  onDisconnect: (account: ConnectedAccount) => void;
  disabled: boolean;
}) {
  const isGoogle = platform === "google";
  const displayName = isGoogle ? "Google Business Profile" : "Yelp";
  const connectedAcct = connected[0] ?? null;
  const isConnected = connectedAcct !== null;

  return (
    <div className="glass-card glow-border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${
            isGoogle ? "bg-blue-500/15 text-blue-400" : "bg-red-500/15 text-red-400"
          }`}>
            {isGoogle ? "G" : "Y"}
          </div>
          <div>
            <div className="font-semibold text-white">{displayName}</div>
            {isConnected ? (
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Connected
                <span className="text-slate-600">·</span>
                <span className="text-slate-500 font-mono">{connectedAcct.platform_business_id}</span>
              </div>
            ) : (
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                Not connected
              </div>
            )}
          </div>
        </div>

        {isConnected ? (
          <button
            onClick={() => onDisconnect(connectedAcct)}
            className="rounded-full border border-red-500/20 bg-red-500/[0.04] px-4 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/[0.08]"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={disabled}
            className="btn-primary text-xs px-4 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}