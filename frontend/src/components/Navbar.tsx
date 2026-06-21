import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  ScrollText,
  Flame,
  Settings2,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard",        icon: LayoutDashboard, label: "Dashboard" },
  { to: "/leads",            icon: Users,           label: "Leads" },
  { to: "/templates",        icon: FileText,         label: "Templates" },
  { to: "/logs",             icon: ScrollText,       label: "Logs" },
  { to: "/interested-leads", icon: Flame,            label: "Interested Leads" },
  { to: "/settings",         icon: Settings2,        label: "Settings" },
];

export default function Navbar() {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col">
      {/* Logo Placeholder (Empty) */}
      <div className="h-[73px] border-b border-gray-100" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-purple-600" : "text-gray-400"}`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Internal Tool v1.0</p>
      </div>
    </aside>
  );
}
