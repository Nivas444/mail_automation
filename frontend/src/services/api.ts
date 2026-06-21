import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Lead {
  id: number;
  name: string;
  email: string;
  company: string;
  status: "pending" | "sent" | "failed";
}

export interface EmailLog {
  id: number;
  lead_id: number | null;
  recipient_email: string;
  company: string;
  subject: string;
  status: "sent" | "failed";
  sent_at: string | null;
  error_message: string;
  opened: boolean;
  opened_at: string | null;
  clicked: boolean;
  clicked_at: string | null;
  click_count: number;
  lead_interest: "cold" | "warm" | "hot";
}

export interface InterestedLead {
  id: number;
  lead_id: number | null;
  name: string;
  email: string;
  company: string;
  opened_at: string | null;
  clicked_at: string | null;
  click_count: number;
  lead_interest: "cold" | "warm" | "hot";
}

export interface Templates {
  subject: string;
  body: string;
}

export interface Settings {
  sender_email: string;
  resend_api_key: string;
  delay_seconds: number;
  landing_page_url: string;
  backend_url: string;
}

export interface CampaignStatus {
  status: "idle" | "running" | "stopped" | "completed";
  current_email: string;
  current_company: string;
  sent: number;
  total: number;
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export const uploadLeads = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/api/leads/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getLeads = async (search?: string): Promise<Lead[]> => {
  const res = await api.get("/api/leads", { params: search ? { search } : {} });
  return res.data;
};

export const deleteLead = async (id: number) => {
  const res = await api.delete(`/api/leads/${id}`);
  return res.data;
};

export const deleteAllLeads = async () => {
  // Delete leads one by one via existing endpoint — backend clears all pending
  const res = await api.delete("/api/leads/all");
  return res.data;
};

export const getInterestedLeads = async (): Promise<InterestedLead[]> => {
  const res = await api.get("/api/leads/interested");
  return res.data;
};

// ── Templates ─────────────────────────────────────────────────────────────────

export const getTemplates = async (): Promise<Templates> => {
  const res = await api.get("/api/templates");
  return res.data;
};

export const saveTemplates = async (data: Templates) => {
  const res = await api.post("/api/templates/save", data);
  return res.data;
};

export const previewTemplates = async (): Promise<Templates> => {
  const res = await api.post("/api/templates/preview");
  return res.data;
};

// ── Settings ─────────────────────────────────────────────────────────────────

export const getSettings = async (): Promise<Settings> => {
  const res = await api.get("/api/settings");
  return res.data;
};

export const saveSettings = async (data: Settings) => {
  const res = await api.post("/api/settings/save", data);
  return res.data;
};

// ── Campaign ─────────────────────────────────────────────────────────────────

export const startCampaign = async () => {
  const res = await api.post("/api/campaign/start");
  return res.data;
};

export const stopCampaign = async () => {
  const res = await api.post("/api/campaign/stop");
  return res.data;
};

export const getCampaignStatus = async (): Promise<CampaignStatus> => {
  const res = await api.get("/api/campaign/status");
  return res.data;
};

// ── Logs ─────────────────────────────────────────────────────────────────────

export const getLogs = async (
  status?: "sent" | "failed",
  search?: string,
  interest?: "cold" | "warm" | "hot"
): Promise<EmailLog[]> => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (search) params.search = search;
  if (interest) params.interest = interest;
  const res = await api.get("/api/logs", { params });
  return res.data;
};

export const deleteLog = async (id: number) => {
  const res = await api.delete(`/api/logs/${id}`);
  return res.data;
};

export const deleteAllLogs = async () => {
  const res = await api.delete("/api/logs/all");
  return res.data;
};

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  total_leads: number;
  sent: number;
  opened: number;
  clicked: number;
  pending: number;
  failed: number;
  open_rate: number;
  click_rate: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get("/api/dashboard/stats");
  return res.data;
};

export default api;
