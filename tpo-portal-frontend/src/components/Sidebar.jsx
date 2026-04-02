import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user, logout, activeRole, toggleRole } = useAuth();
  const navigate = useNavigate();
  const isCRC = user?.role === 'CRC';
  const isInStudentMode = activeRole === 'STUDENT';
  const links = [
    { name: "Dashboard", path: "/student/dashboard" },
    { name: "Profile", path: "/student/profile" },
    { name: "All Jobs", path: "/student/all-jobs" },
    { name: "Eligible Jobs", path: "/student/eligible-companies" },
    { name: "Applications", path: "/student/applications" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const student = {
    name: user?.name || "Student",
    avatar: user?.name
      ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=0B5ED7&fontSize=40`
      : "https://api.dicebear.com/9.x/initials/svg?seed=Student&backgroundColor=0B5ED7&fontSize=40",
  };

  const handleRoleToggle = () => {
    toggleRole();
    // Navigate to the appropriate dashboard based on the new role
    if (isInStudentMode) {
      // Switching from Student to CRC mode
      navigate("/crc/dashboard");
    } else {
      // Switching from CRC to Student mode
      navigate("/student/dashboard");
    }
  };

  return (
    <aside className="w-64 bg-blue-800 text-white min-h-screen flex flex-col justify-between p-4">
      <div>
        {/* Header */}
        <div className={`p-4 border-b border-blue-700 -mx-4 -mt-4 ${isCRC ? 'mb-4' : ''}`}>
          <h2 className="text-xl font-bold">Student Panel</h2>
          <p className="text-sm text-blue-200 mt-1">NIT Srinagar</p>
        </div>

        {/* Role Toggle for CRC Users */}
        {isCRC && (
          <div className="mb-4 bg-blue-900 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-200">
                {isInStudentMode ? "🎓 Student View" : "🏢 CRC View"}
              </span>
              <button
                onClick={handleRoleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  isInStudentMode ? "bg-blue-500" : "bg-green-600"
                }`}
              >
                <span
                  className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform duration-200 ${
                    isInStudentMode ? "translate-x-5" : "translate-x-0.5"
                  }`}
                ></span>
              </button>
            </div>
          </div>
        )}

        <nav>
          <ul className="space-y-4">
            {links.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  end={link.path === "dashboard"}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg ${
                      isActive ? "bg-blue-600" : "hover:bg-blue-700"
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-blue-600 mt-6 pt-4">
        <div className="flex items-center space-x-3 mb-3">
          <img
            src={student.avatar}
            alt="Student Avatar"
            className="w-12 h-12 rounded-full border-2 border-blue-500"
          />
          <div>
            <p className="font-semibold">{student.name}</p>
            <p className="text-sm text-blue-200">
              {isCRC ? (isInStudentMode ? "Student View" : "CRC") : "Student"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-700 text-sm text-blue-200"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
