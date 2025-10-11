import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const links = [
    { name: "Profile", path: "profile" },
    { name: "All Companies", path: "all-companies" },
    { name: "Eligible Companies", path: "eligible-companies" },
    { name: "Application Tracker", path: "applications" },
  ];

  // Example: replace these static values with dynamic data from user context/state later
  const student = {
    name: "Karan Sharma",
    avatar:
      "https://api.dicebear.com/9.x/initials/svg?seed=Karan%20Sharma&backgroundColor=0B5ED7&fontSize=40",
  };

  return (
    <aside className="w-64 bg-blue-800 text-white min-h-screen flex flex-col justify-between p-4">
      {/* Upper Section */}
      <div>
        <h2 className="text-2xl font-bold mb-8 text-center">T&P Portal</h2>
        <nav>
          <ul className="space-y-4">
            {links.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  relative="route"
                  end
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

      {/* Bottom Profile Section */}
      <div className="border-t border-blue-600 mt-6 pt-4 flex items-center space-x-3">
        <img
          src={student.avatar}
          alt="Student Avatar"
          className="w-12 h-12 rounded-full border-2 border-blue-500"
        />
        <div>
          <p className="font-semibold">{student.name}</p>
          <p className="text-sm text-blue-200">Student</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
