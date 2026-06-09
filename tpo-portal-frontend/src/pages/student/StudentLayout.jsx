import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import Sidebar from "../../components/Sidebar";
import { GET_ME } from "../../graphql/queries";
import { AlertCircle, Menu } from "../../components/Icons";

const EMPLOYMENT_TYPE_LABELS = {
  INTERN_ONLY: "Intern Only",
  INTERN_PPO: "Intern + PPO",
  INTERN_FTE: "Intern + FTE",
  FTE_ONLY: "FTE Only",
};

const StudentLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { data: meData } = useQuery(GET_ME, {
    fetchPolicy: "cache-and-network",
  });

  const blockedJobTypes = meData?.me?.blockedJobTypes || [];
  const blockedLabels = blockedJobTypes.map((type) => EMPLOYMENT_TYPE_LABELS[type] || type);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto transition-transform duration-300 ease-in-out">
        {/* Mobile Header - Hidden on Desktop */}
        <header className={`lg:hidden sticky top-0 z-[60] bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3 transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-60' : ''}`}>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-zinc-900">Training & Placement</h1>
            <p className="text-xs text-zinc-500">NIT Srinagar</p>
          </div>
        </header>

        <div className={`p-4 sm:p-6 lg:p-8 transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-60' : ''}`}>
          {blockedLabels.length > 0 && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    You are blocked from applying to {blockedLabels.join(", ")} opportunities by the administrator.
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    If you have any query, please contact the Training and Placement admin.
                  </p>
                </div>
              </div>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
