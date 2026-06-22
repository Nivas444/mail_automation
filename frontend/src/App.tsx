import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Templates from "./pages/Templates";
import Logs from "./pages/Logs";
import InterestedLeads from "./pages/InterestedLeads";
import SettingsPage from "./pages/Settings";
import SettingsSynchronizer from "./components/SettingsSynchronizer";

export default function App() {
  return (
    <BrowserRouter>
      <SettingsSynchronizer />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <Navbar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/interested-leads" element={<InterestedLeads />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
