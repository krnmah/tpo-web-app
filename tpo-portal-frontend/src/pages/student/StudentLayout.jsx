import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import { Menu } from "../../components/Icons";

const StudentLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto transition-transform duration-300 ease-in-out">
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
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
