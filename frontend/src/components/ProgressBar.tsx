interface ProgressBarProps {
  sent: number;
  total: number;
  status: string;
}

export default function ProgressBar({ sent, total, status }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  const isRunning = status === "running";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          {sent.toLocaleString()} / {total.toLocaleString()} Emails Sent
        </span>
        <span className="font-bold text-purple-600">{pct}%</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            isRunning
              ? "bg-gradient-to-r from-purple-500 to-purple-600"
              : status === "completed"
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : status === "failed"
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : "bg-gradient-to-r from-purple-400 to-purple-500"
          } ${isRunning ? "animate-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
