import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Upload, Search, Download, Trash2 } from "lucide-react";

import LeadTable from "../components/LeadTable";
import { getLeads, uploadLeads, deleteLead, deleteAllLeads } from "../services/api";
import type { Lead } from "../services/api";

function exportToCSV(leads: Lead[]) {
  const header = "Name,Email,Company,Status";
  const rows = leads.map(
    (l) => `"${l.name}","${l.email}","${l.company}","${l.status}"`
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Leads() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", search],
    queryFn: () => getLeads(search || undefined),
  });

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

  const deleteMut = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      toast.success("Lead deleted.");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: () => toast.error("Failed to delete lead."),
  });

  const deleteAllMut = useMutation({
    mutationFn: deleteAllLeads,
    onSuccess: (data) => {
      toast.success(data.message || "All leads deleted.");
      setConfirmClear(false);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: () => toast.error("Failed to delete all leads."),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMut.mutate(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            id="leads-file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            id="leads-upload-btn"
            className="btn-primary"
            onClick={() => fileRef.current?.click()}
            disabled={uploadMut.isPending}
          >
            <Upload className="w-4 h-4" />
            {uploadMut.isPending ? "Uploading..." : "Upload CSV / XLSX"}
          </button>
          <button
            id="leads-export-btn"
            className="btn-secondary"
            onClick={() => exportToCSV(leads)}
            disabled={leads.length === 0}
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {/* Delete All */}
          {!confirmClear ? (
            <button
              id="leads-delete-all-btn"
              className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors duration-150 disabled:opacity-50"
              onClick={() => setConfirmClear(true)}
              disabled={leads.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-xs text-red-700 font-medium">Delete all {leads.length} leads?</span>
              <button
                id="leads-confirm-delete-all"
                className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-colors"
                onClick={() => deleteAllMut.mutate()}
                disabled={deleteAllMut.isPending}
              >
                {deleteAllMut.isPending ? "Deleting..." : "Yes, delete"}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id="leads-search"
          type="text"
          className="input pl-9"
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400">Loading leads...</div>
        ) : (
          <LeadTable
            leads={leads}
            onDelete={(id) => deleteMut.mutate(id)}
            isDeleting={deleteMut.isPending}
          />
        )}
      </div>
    </div>
  );
}
