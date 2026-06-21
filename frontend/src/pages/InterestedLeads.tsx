import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Flame, Download, MousePointerClick, MailOpen, Inbox, Trash2 } from "lucide-react";
import { getInterestedLeads, deleteLog, deleteAllLogs } from "../services/api";
import type { InterestedLead } from "../services/api";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function InterestBadge({ interest }: { interest: "cold" | "warm" | "hot" }) {
  const config = {
    hot:  { label: "🔥 Hot",   cls: "bg-red-100 text-red-700 border border-red-200" },
    warm: { label: "🌤 Warm",  cls: "bg-amber-100 text-amber-700 border border-amber-200" },
    cold: { label: "❄️ Cold", cls: "bg-slate-100 text-slate-600 border border-slate-200" },
  };
  const { label, cls } = config[interest] ?? config.cold;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function exportCSV(leads: InterestedLead[]) {
  const header = "Name,Email,Company,Opened At,Clicked At,Click Count,Lead Interest";
  const rows = leads.map(
    (l) =>
      `"${l.name}","${l.email}","${l.company}","${formatDate(l.opened_at)}","${formatDate(l.clicked_at)}","${l.click_count}","${l.lead_interest}"`
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "interested_leads.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function InterestedLeads() {
  const qc = useQueryClient();
  const [confirmClear, setConfirmClear] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["interested-leads"],
    queryFn: getInterestedLeads,
    refetchInterval: 10000,
  });

  const deleteOneMut = useMutation({
    mutationFn: deleteLog,
    onSuccess: () => {
      toast.success("Lead removed.");
      qc.invalidateQueries({ queryKey: ["interested-leads"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: () => toast.error("Failed to remove entry."),
  });

  const clearAllMut = useMutation({
    mutationFn: deleteAllLogs,
    onSuccess: (data) => {
      toast.success(data.message || "All entries cleared.");
      setConfirmClear(false);
      qc.invalidateQueries({ queryKey: ["interested-leads"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: () => toast.error("Failed to clear entries."),
  });

  const TABLE_HEADERS = [
    "Name", "Email", "Company", "Opened At", "Clicked At", "Clicks", "Lead Interest", "",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">Interested Leads</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Leads who clicked your email link — your hottest prospects.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Stats pill */}
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full px-3 py-1.5 text-sm font-semibold">
            <Flame className="w-4 h-4" />
            {leads.length} Hot Lead{leads.length !== 1 ? "s" : ""}
          </div>
          <button
            id="interested-export-btn"
            className="btn-secondary"
            onClick={() => exportCSV(leads)}
            disabled={leads.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          {/* Clear All */}
          {!confirmClear ? (
            <button
              id="interested-clear-all-btn"
              className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors duration-150 disabled:opacity-50"
              onClick={() => setConfirmClear(true)}
              disabled={leads.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-xs text-red-700 font-medium">Clear all entries?</span>
              <button
                id="interested-confirm-clear"
                className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-colors"
                onClick={() => clearAllMut.mutate()}
                disabled={clearAllMut.isPending}
              >
                {clearAllMut.isPending ? "Clearing..." : "Yes, clear"}
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

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
        <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <MousePointerClick className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-800">How this works</p>
          <p className="text-sm text-orange-700 mt-0.5">
            Every email contains a tracked link. When a recipient clicks it, they are redirected to your
            landing page and their interest is automatically captured here. These leads have shown
            active intent — prioritize them for follow-up!
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400">Loading interested leads...</div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No interested leads yet</p>
            <p className="text-sm mt-1">
              Leads who click your tracked link will appear here automatically.
            </p>
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
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-orange-50/40 transition-colors duration-100"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {lead.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-blue-600 font-medium">
                      <a href={`mailto:${lead.email}`} className="hover:underline">
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.company || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {lead.opened_at ? (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <MailOpen className="w-3.5 h-3.5" />
                          {formatDate(lead.opened_at)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                        <MousePointerClick className="w-3.5 h-3.5" />
                        {formatDate(lead.clicked_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                        {lead.click_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <InterestBadge interest={lead.lead_interest} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteOneMut.mutate(lead.id)}
                        disabled={deleteOneMut.isPending}
                        className="btn-danger py-1 px-2.5 text-xs"
                        title="Remove this entry"
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
