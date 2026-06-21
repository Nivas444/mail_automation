import { Trash2 } from "lucide-react";
import type { Lead } from "../services/api";

interface LeadTableProps {
  leads: Lead[];
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

export default function LeadTable({ leads, onDelete, isDeleting }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p className="font-medium text-gray-500">No leads found</p>
        <p className="text-sm mt-1">Upload a CSV or XLSX file to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50 transition-colors duration-100">
              <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
              <td className="px-4 py-3 text-gray-600">{lead.email}</td>
              <td className="px-4 py-3 text-gray-600">{lead.company || "—"}</td>
              <td className="px-4 py-3">
                <span className={`badge-${lead.status}`}>{lead.status}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onDelete(lead.id)}
                  disabled={isDeleting}
                  className="btn-danger py-1 px-2.5 text-xs"
                  title="Delete lead"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
