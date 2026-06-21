import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Settings2, Save, Link, Info } from "lucide-react";
import { getSettings, saveSettings } from "../services/api";
import type { Settings } from "../services/api";

export default function SettingsPage() {
  const qc = useQueryClient();

  const [form, setForm] = useState<Settings>({
    sender_email: "",
    resend_api_key: "",
    delay_seconds: 5,
    landing_page_url: "https://landing.sortyx.com",
    backend_url: "http://localhost:8000",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || "Failed to save settings."),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure email settings, API credentials, and tracking URLs.
        </p>
      </div>

      {/* Configuration Form */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-4 h-4 text-purple-600" />
          <h2 className="text-sm font-semibold text-gray-800">Sender & URL Configuration</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Sender Email
            </label>
            <input
              id="settings-sender-email"
              type="email"
              className="input"
              placeholder="contact@yourcompany.com"
              value={form.sender_email}
              onChange={(e) => setForm({ ...form, sender_email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Resend API Key
            </label>
            <input
              id="settings-api-key"
              type="password"
              className="input"
              placeholder="re_xxxxxxxxxxxx"
              value={form.resend_api_key}
              onChange={(e) => setForm({ ...form, resend_api_key: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Delay Between Emails (seconds)
            </label>
            <input
              id="settings-delay"
              type="number"
              min={0}
              className="input"
              placeholder="5"
              value={form.delay_seconds}
              onChange={(e) =>
                setForm({ ...form, delay_seconds: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <span className="flex items-center gap-1">
                <Link className="w-3 h-3" />
                Landing Page URL
              </span>
            </label>
            <input
              id="settings-landing-url"
              type="url"
              className="input"
              placeholder="https://landing.sortyx.com"
              value={form.landing_page_url}
              onChange={(e) => setForm({ ...form, landing_page_url: e.target.value })}
            />
          </div>
        </div>

        {/* Backend URL row */}
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Backend / Tracking URL
            <span className="ml-1.5 text-gray-400 font-normal">(your deployed backend — used inside emails for click &amp; open tracking)</span>
          </label>
          <input
            id="settings-backend-url"
            type="url"
            className="input"
            placeholder="https://api.yourdomain.com"
            value={form.backend_url}
            onChange={(e) => setForm({ ...form, backend_url: e.target.value })}
          />
        </div>

        {/* URL Explanation Help Box */}
        <div className="mt-4 p-3.5 bg-purple-50/50 rounded-lg border border-purple-100/80 text-xs text-purple-950 space-y-1.5 leading-relaxed">
          <p className="font-semibold text-purple-800 flex items-center gap-1.5 text-[13px]">
            <Info className="w-4 h-4 text-purple-600" /> Why are two different URLs needed?
          </p>
          <p>
            When a lead clicks the link in an email, they are temporarily routed to your <strong>Backend / Tracking URL</strong> first so the database can register that they clicked. The backend then immediately redirects them to your actual <strong>Landing Page URL</strong>. This redirect is instantaneous.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5 pt-1.5 border-t border-purple-100">
            <div>
              <span className="font-semibold text-purple-800">1. Landing Page URL</span>
              <p className="text-gray-600 mt-0.5">Where the user actually lands (your Vercel site, e.g. <code>https://never-miss-ai-tau.vercel.app/</code>)</p>
            </div>
            <div>
              <span className="font-semibold text-purple-800">2. Backend / Tracking URL</span>
              <p className="text-gray-600 mt-0.5">Where your FastAPI server runs (e.g. your local tunnel or deployed backend API URL. <em>Do not set this to the Vercel URL</em>)</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            id="settings-save-btn"
            className="btn-primary"
            onClick={() => saveMut.mutate(form)}
            disabled={saveMut.isPending}
          >
            <Save className="w-4 h-4" />
            {saveMut.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
