import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: "purple" | "green" | "amber" | "red" | "blue" | "indigo" | "orange" | "teal";
}

const COLOR_MAP = {
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    value: "text-purple-700",
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-600",
    value: "text-green-700",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    value: "text-amber-700",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-600",
    value: "text-red-700",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    value: "text-blue-700",
  },
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    value: "text-indigo-700",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-600",
    value: "text-orange-700",
  },
  teal: {
    bg: "bg-teal-50",
    icon: "text-teal-600",
    value: "text-teal-700",
  },
};

export default function StatsCard({ label, value, icon: Icon, color }: StatsCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${c.value}`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}
