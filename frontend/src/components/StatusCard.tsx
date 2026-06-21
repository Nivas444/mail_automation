import { Activity, Mail, Building2 } from "lucide-react";

interface StatusCardProps {
  currentEmail: string;
  currentCompany: string;
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  idle: "Idle — waiting to start",
  running: "Sending...",
  stopped: "Stopped",
  completed: "All done!",
};

export default function StatusCard({ currentEmail, currentCompany, status }: StatusCardProps) {
  const isRunning = status === "running";

  return (
    <div className="card border-l-4 border-l-purple-500">
      <div className="flex items-center gap-2 mb-3">
        <Activity
          className={`w-4 h-4 ${isRunning ? "text-purple-600 animate-pulse" : "text-gray-400"}`}
        />
        <p className="text-sm font-semibold text-gray-700">Current Activity</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 w-24 shrink-0">Sending to:</span>
          <span className="text-sm font-medium text-gray-900 truncate">
            {currentEmail || "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 w-24 shrink-0">Company:</span>
          <span className="text-sm font-medium text-gray-900 truncate">
            {currentCompany || "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isRunning ? "bg-green-400 animate-pulse" : "bg-gray-300"
            }`}
          />
          <span className="text-sm font-medium text-gray-700">
            {STATUS_LABEL[status] || status}
          </span>
        </div>
      </div>
    </div>
  );
}
