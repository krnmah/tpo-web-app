import { NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "./ConfirmDialog";
import {
  LayoutDashboard,
  User,
  Building,
  Briefcase,
  FileText,
  FileCheck,
  LogOut,
  SwitchHorizontal,
  X,
} from "./Icons";

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout, activeRole, toggleRole } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const isCRC = user?.role === 'CRC';
  const isInStudentMode = activeRole === 'STUDENT';

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileOpen && onClose) {
        onClose();
      }
    };
    if (mobileOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [mobileOpen, onClose]);

  const links = [
    { name: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
    { name: "Profile", path: "/student/profile", icon: User },
    { name: "All Jobs", path: "/student/all-jobs", icon: Briefcase },
    { name: "Eligible Jobs", path: "/student/eligible-companies", icon: Building },
    { name: "Applications", path: "/student/applications", icon: FileText },
    { name: "Get NOC", path: "/student/noc", icon: FileCheck },
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
    if (onClose) onClose();
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const avatar = user?.name
    ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=18181b&fontSize=40&textColor=ffffff`
    : "https://api.dicebear.com/9.x/initials/svg?seed=S&backgroundColor=18181b&fontSize=40&textColor=ffffff";

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-auto
        w-60 bg-zinc-900 min-h-screen flex flex-col
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Header */}
      <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">Training & Placement</h2>
          <p className="text-xs text-zinc-500 mt-0.5">NIT Srinagar</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
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
                  onClick={handleNavClick}
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
    </>
  );
};

export default Sidebar;
