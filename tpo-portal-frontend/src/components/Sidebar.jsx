import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "./ConfirmDialog";
import {
  LayoutDashboard,
  User,
  Building,
  Briefcase,
  FileText,
  LogOut,
  SwitchHorizontal,
} from "./Icons";

const Sidebar = () => {
  const { user, logout, activeRole, toggleRole } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const isCRC = user?.role === 'CRC';
  const isInStudentMode = activeRole === 'STUDENT';

  const links = [
    { name: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
    { name: "Profile", path: "/student/profile", icon: User },
    { name: "All Jobs", path: "/student/all-jobs", icon: Briefcase },
    { name: "Eligible Jobs", path: "/student/eligible-companies", icon: Building },
    { name: "Applications", path: "/student/applications", icon: FileText },
  ];

  const handleLogout = async () => {
    const confirmed = await confirm(
      "Are you sure you want to log out?",
      "Confirm Logout"
    );
    if (confirmed) {
      logout();
      navigate("/auth");
    }
  };

  const handleRoleToggle = () => {
    toggleRole();
    if (isInStudentMode) {
      navigate("/crc/dashboard");
    } else {
      navigate("/student/dashboard");
    }
  };

  const avatar = user?.name
    ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=18181b&fontSize=40&textColor=ffffff`
    : "https://api.dicebear.com/9.x/initials/svg?seed=S&backgroundColor=18181b&fontSize=40&textColor=ffffff";

  return (
    <aside className="w-60 bg-zinc-900 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white tracking-tight">Training & Placement</h2>
        <p className="text-xs text-zinc-500 mt-0.5">NIT Srinagar</p>
      </div>

      {/* Role Toggle for CRC */}
      {isCRC && (
        <div className="p-3 border-b border-zinc-800">
          <button
            onClick={handleRoleToggle}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <span className="text-xs font-medium text-zinc-300">
              {isInStudentMode ? "Student View" : "CRC View"}
            </span>
            <SwitchHorizontal className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  end={link.path === "/student/dashboard"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <img
            src={avatar}
            alt="Avatar"
            className="w-8 h-8 rounded-full bg-zinc-800"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Student'}</p>
            <p className="text-xs text-zinc-500 truncate">
              {isCRC ? (isInStudentMode ? "Student" : "CRC") : "Student"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
