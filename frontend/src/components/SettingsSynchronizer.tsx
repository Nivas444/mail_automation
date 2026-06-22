import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, saveSettings } from "../services/api";
import toast from "react-hot-toast";

export default function SettingsSynchronizer() {
  const qc = useQueryClient();
  const hasAttemptedSync = useRef(false);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const saveMut = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings restored from browser storage!", {
        id: "settings-restore-toast",
      });
    },
    onError: (err) => {
      console.error("Failed to auto-restore settings to backend:", err);
    },
  });

  useEffect(() => {
    if (!settings) return;

    // Check if the backend settings are empty/missing credentials
    const isBackendEmpty = !settings.resend_api_key && !settings.sender_email;

    if (isBackendEmpty) {
      if (hasAttemptedSync.current) return;

      const stored = localStorage.getItem("mail_automation_settings");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.resend_api_key || parsed.sender_email) {
            hasAttemptedSync.current = true;
            saveMut.mutate(parsed);
          }
        } catch (e) {
          console.error("Error parsing settings from localStorage:", e);
        }
      }
    } else {
      // Backend has settings, store them in localStorage
      localStorage.setItem(
        "mail_automation_settings",
        JSON.stringify({
          sender_email: settings.sender_email,
          resend_api_key: settings.resend_api_key,
          delay_seconds: settings.delay_seconds,
          landing_page_url: settings.landing_page_url,
          backend_url: settings.backend_url,
        })
      );
    }
  }, [settings]);

  return null;
}
