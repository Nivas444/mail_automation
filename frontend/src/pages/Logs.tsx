import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Search, Download, CheckCircle, XCircle, Inbox,
  MailOpen, MousePointerClick, Trash2,
} from "lucide-react";
import { getLogs, deleteLog, deleteAllLogs } from "../services/api";
import type { EmailLog } from "../services/api";

type StatusFilter = "all" | "sent" | "failed";
type InterestFilter = "all" | "cold" | "warm" | "hot";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function InterestBadge({ interest }: { interest: "cold" | "warm" | "hot" }) {
  const config = {
    hot: { label: "🔥 Hot", cls: "bg-red-100 text-red-700 border border-red-200" },
    warm: { label: "🌤 Warm", cls: "bg-amber-100 text-amber-700 border border-amber-200" },
    cold: { label: "❄️ Cold", cls: "bg-slate-100 text-slate-600 border border-slate-200" },
  };
  const { label, cls } = config[interest] ?? config.cold;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function exportLogsCSV(logs: EmailLog[]) {
  const header = "Recipient,Company,Status,Opened,Opened Time,Clicked,Clicked Time,Click Count,Interest,Sent Time";
  const rows = logs.map(
    (l) =>
      `"${l.recipient_email}","${l.company || ""}","${l.status}","${l.opened ? "Yes" : "No"}","${formatDate(l.opened_at)}","${l.clicked ? "Yes" : "No"}","${formatDate(l.clicked_at)}","${l.click_count ?? 0}","${l.lead_interest ?? "cold"}","${formatDate(l.sent_at)}"`
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "email_logs.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Logs() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [interestFilter, setInterestFilter] = useState<InterestFilter>("all");
  const [search, setSearch] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["logs", statusFilter, interestFilter, search],
    queryFn: () =>
      getLogs(
        statusFilter !== "all" ? statusFilter : undefined,
        search || undefined,
        interestFilter !== "all" ? interestFilter : undefined
      ),
    refetchInterval: 5000,
  });

  const deleteLogMut = useMutation({
    mutationFn: deleteLog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["interested-leads"] });
    },
    onError: () => toast.error("Failed to delete log."),
  });

  const deleteAllMut = useMutation({
    mutationFn: deleteAllLogs,
    onSuccess: (data) => {
      toast.success(data.message || "All logs cleared.");
      setConfirmClear(false);
      qc.invalidateQueries({ queryKey: ["logs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["interested-leads"] });
    },
    onError: () => toast.error("Failed to clear logs."),
  });

  const STATUS_FILTERS: { key: StatusFilter; label: string; icon?: React.ReactNode }[] = [
    { key: "all",    label: "All" },
    { key: "sent",   label: "Sent",   icon: <CheckCircle className="w-3.5 h-3.5 text-green-500" /> },
    { key: "failed", label: "Failed", icon: <XCircle     className="w-3.5 h-3.5 text-red-500"   /> },
  ];

  const INTEREST_FILTERS: { key: InterestFilter; label: string }[] = [
    { key: "all",  label: "All Interest" },
    { key: "hot",  label: "🔥 Hot" },
    { key: "warm", label: "🌤 Warm" },
    { key: "cold", label: "❄️ Cold" },
  ];

  const TABLE_HEADERS = [
    "Recipient", "Company", "Status",
    "Opened", "Opened Time",
    "Clicked", "Clicked Time", "Clicks",
    "Interest", "Sent Time", "",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {logs.length} log entr{logs.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="logs-export-btn"
            className="btn-secondary"
            onClick={() => exportLogsCSV(logs)}
            disabled={logs.length === 0}
          >
            <Download className="w-4 h-4" />
            Export Logs
          </button>

          {/* Clear All */}
          {!confirmClear ? (
            <button
              id="logs-clear-all-btn"
              className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors duration-150 disabled:opacity-50"
              onClick={() => setConfirmClear(true)}
              disabled={logs.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-xs text-red-700 font-medium">Clear all logs?</span>
              <button
                id="logs-confirm-clear"
                className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-colors"
                onClick={() => deleteAllMut.mutate()}
                disabled={deleteAllMut.isPending}
              >
                {deleteAllMut.isPending ? "Clearing..." : "Yes, clear"}
              </button>
              <button
                className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status filter tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {STATUS_FILTERS.map(({ key, label, icon }) => (
              <button
                key={key}
                id={`logs-filter-${key}`}
                onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  statusFilter === key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Interest filter tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {INTEREST_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                id={`logs-interest-${key}`}
                onClick={() => setInterestFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  interestFilter === key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="logs-search"
              type="text"
              className="input pl-9"
              placeholder="Search by email, company, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No logs yet</p>
            <p className="text-sm mt-1">Email logs will appear here after running a campaign.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {TABLE_HEADERS.map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-100">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {log.recipient_email}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.company || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`badge-${log.status}`}>{log.status}</span>
                    </td>

                    {/* Opened */}
                    <td className="px-4 py-3">
                      {log.opened ? (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                          <MailOpen className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="badge-idle">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(log.opened_at)}
                    </td>

                    {/* Clicked */}
                    <td className="px-4 py-3">
                      {log.clicked ? (
                        <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                          <MousePointerClick className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="badge-idle">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(log.clicked_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.click_count > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                          {log.click_count}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>

                    {/* Interest */}
                    <td className="px-4 py-3">
                      <InterestBadge interest={log.lead_interest ?? "cold"} />
                    </td>

                    {/* Sent Time */}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(log.sent_at)}
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteLogMut.mutate(log.id)}
                        disabled={deleteLogMut.isPending}
                        className="btn-danger py-1 px-2.5 text-xs"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
