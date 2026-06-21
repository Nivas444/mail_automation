import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Users, CheckCircle, Clock, XCircle,
  Upload, PlayCircle, StopCircle,
  MailOpen, Percent, MousePointerClick, TrendingUp,
} from "lucide-react";

import StatsCard from "../components/StatsCard";
import ProgressBar from "../components/ProgressBar";
import StatusCard from "../components/StatusCard";
import {
  getLeads, getCampaignStatus,
  startCampaign, stopCampaign, uploadLeads, getDashboardStats,
} from "../services/api";
import type { CampaignStatus } from "../services/api";

export default function Dashboard() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => getLeads(),
  });

  const { data: campaignStatus, refetch: refetchStatus } = useQuery<CampaignStatus>({
    queryKey: ["campaign-status"],
    queryFn: getCampaignStatus,
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 2000 : false,
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    refetchInterval: () =>
      campaignStatus?.status === "running" ? 2000 : false,
  });

  // Refresh leads and stats when campaign completes
  useEffect(() => {
    if (campaignStatus?.status === "completed" || campaignStatus?.status === "stopped") {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
  }, [campaignStatus?.status, qc]);

  // ── Computed stats ────────────────────────────────────────────────────────
  const total = stats?.total_leads ?? leads.length;
  const sent = stats?.sent ?? leads.filter((l) => l.status === "sent").length;
  const pending = stats?.pending ?? leads.filter((l) => l.status === "pending").length;
  const failed = stats?.failed ?? leads.filter((l) => l.status === "failed").length;
  const opened = stats?.opened ?? 0;
  const clicked = stats?.clicked ?? 0;
  const openRate = stats?.open_rate ?? 0;
  const clickRate = stats?.click_rate ?? 0;

  const uploadMut = useMutation({
    mutationFn: uploadLeads,
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || "Upload failed."),
  });

  const startMut = useMutation({
    mutationFn: startCampaign,
    onSuccess: (data) => {
      toast.success(data.message);
      refetchStatus();
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || "Could not start campaign."),
  });

  const stopMut = useMutation({
    mutationFn: stopCampaign,
    onSuccess: () => {
      toast("Stop signal sent.", { icon: "🛑" });
      refetchStatus();
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || "Could not stop campaign."),
  });

  const isRunning = campaignStatus?.status === "running";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      uploadMut.mutate(file);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your email campaign from one place.
        </p>
      </div>



      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatsCard label="Total Leads" value={total} icon={Users} color="purple" />
        <StatsCard label="Sent" value={sent} icon={CheckCircle} color="green" />
        <StatsCard label="Opened" value={opened} icon={MailOpen} color="blue" />
        <StatsCard label="Clicked" value={clicked} icon={MousePointerClick} color="orange" />
        <StatsCard label="Open Rate" value={`${openRate}%`} icon={Percent} color="indigo" />
        <StatsCard label="Click Rate" value={`${clickRate}%`} icon={TrendingUp} color="teal" />
        <StatsCard label="Pending" value={pending} icon={Clock} color="amber" />
        <StatsCard label="Failed" value={failed} icon={XCircle} color="red" />
      </div>

      {/* Campaign controls */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Campaign Controls</h2>
        <div className="flex flex-wrap gap-3">
          {/* Upload */}
          <input
            ref={fileRef}
            id="dashboard-file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            id="dashboard-upload-btn"
            className="btn-secondary"
            onClick={() => fileRef.current?.click()}
            disabled={uploadMut.isPending}
          >
            <Upload className="w-4 h-4" />
            {uploadMut.isPending ? "Uploading..." : "Upload Spreadsheet"}
          </button>

          {/* Filename chip */}
          {uploadedFileName && !uploadMut.isPending && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-600 font-medium max-w-[200px]">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{uploadedFileName}</span>
            </span>
          )}

          {/* Start */}
          <button
            id="dashboard-start-btn"
            className="btn-primary"
            onClick={() => startMut.mutate()}
            disabled={isRunning || startMut.isPending}
          >
            <PlayCircle className="w-4 h-4" />
            Start Campaign
          </button>

          {/* Stop */}
          <button
            id="dashboard-stop-btn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg
                       hover:bg-red-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            onClick={() => stopMut.mutate()}
            disabled={!isRunning || stopMut.isPending}
          >
            <StopCircle className="w-4 h-4" />
            Stop Campaign
          </button>
        </div>

        {/* Campaign badge — only when not idle */}
        {campaignStatus && campaignStatus.status !== "idle" && (
          <div className="mt-3">
            <span className={`badge-${campaignStatus.status}`}>
              {campaignStatus.status.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar — full width */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Campaign Progress</h2>
        <ProgressBar
          sent={campaignStatus?.sent ?? 0}
          total={campaignStatus?.total ?? 0}
          status={campaignStatus?.status ?? "idle"}
        />
      </div>

      {/* Status card — full width, more room to breathe */}
      <StatusCard
        currentEmail={campaignStatus?.current_email ?? ""}
        currentCompany={campaignStatus?.current_company ?? ""}
        status={campaignStatus?.status ?? "idle"}
      />
    </div>
  );
}
