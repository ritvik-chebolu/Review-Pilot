import { createFileRoute } from '@tanstack/react-router'
import { clientGetBusiness, clientUpsertBusiness } from "~/lib/api";
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

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

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
  { value: "professional", label: "Professional" },
  { value: "warm", label: "Warm & Friendly" },
  { value: "casual", label: "Casual" },
  { value: "family-oriented", label: "Family-Oriented" },
  { value: "formal", label: "Formal" },
];

const SIGNATURE_STYLES = [
  { value: "business-name", label: "Business name (e.g. ~ Acme Plumbing)" },
  { value: "first-person", label: "First person (e.g. ~ John)" },
  { value: "we", label: "We (e.g. ~ The Acme Team)" },
];

function SettingsPage() {
  const auth = useAuth();
  const navigate = useNavigate();

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

  // Redirect to login if not authenticated
  if (!auth.isLoading && !auth.user) {
    navigate({ to: "/login" });
    return null;
  }

  useEffect(() => {
    if (!auth.user) return;
    clientGetBusiness(auth.user.id)
      .then((biz) => {
        if (biz) {
          setBusinessId(biz.id);
          setBusinessName(biz.business_name);
          setBusinessType(biz.business_type);
          setLocation(biz.location);
          setBrandVoice(biz.brand_voice);
          setSignatureStyle(biz.signature_style);
          setCustomInstructions(biz.custom_instructions);
        }
      })
      .finally(() => setLoading(false));
  }, [auth.user]);

  const handleSubmit = async (e: React.FormEvent) => {
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

  if (auth.isLoading || loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Business Settings</h1>
        <p className="text-sm text-gray-500">Configure your business profile and brand voice for AI responses.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Business Information</h2>
          <p className="mt-1 text-sm text-gray-500">This info is used to personalize your review responses.</p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Business name
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Acme Plumbing"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                Business type
              </label>
              <select
                id="businessType"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Portland, OR"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Brand voice */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Brand Voice</h2>
          <p className="mt-1 text-sm text-gray-500">Control how ReviewPilot responds to reviews on your behalf.</p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="brandVoice" className="block text-sm font-medium text-gray-700">
                Tone
              </label>
              <select
                id="brandVoice"
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {BRAND_VOICES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="signatureStyle" className="block text-sm font-medium text-gray-700">
                Signature style
              </label>
              <select
                id="signatureStyle"
                value={signatureStyle}
                onChange={(e) => setSignatureStyle(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {SIGNATURE_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-700">
                Custom instructions
              </label>
              <textarea
                id="customInstructions"
                rows={4}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="E.g. Always mention our 24/7 emergency service. Never make promises about pricing without approval."
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                These instructions will be given to the AI along with each review when drafting a response.
              </p>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || !businessName.trim()}
            className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Settings saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}