import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../components/ConfirmDialog";
import { GET_COMPANIES, GET_DASHBOARD_STATS, GET_STUDENTS } from "../../graphql/queries";
import { ASSIGN_CRC, REMOVE_CRC } from "../../graphql/queries";
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  TrendingUp,
  LogOut,
  Plus,
  X,
  Check,
  Shield,
} from "../../components/Icons";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const activeTab = location.pathname.split('/').pop() || "dashboard";

  const { data: statsData, refetch: refetchStats } = useQuery(GET_DASHBOARD_STATS, { fetchPolicy: "network-only" });
  const { data: companiesData } = useQuery(GET_COMPANIES, { fetchPolicy: "network-only" });
  const { data: studentsData, refetch: refetchStudents } = useQuery(GET_STUDENTS, { fetchPolicy: "network-only" });

  const [assignCRC] = useMutation(ASSIGN_CRC);
  const [removeCRC] = useMutation(REMOVE_CRC);

  const stats = statsData?.dashboardStats || { totalStudents: 0, totalCompanies: 0, activeJobs: 0, totalApplications: 0, placementPercentage: 0 };
  const companies = companiesData?.companies || [];
  const students = studentsData?.students || [];

  const [crcEmail, setCrcEmail] = useState("");
  const [showCRCForm, setShowCRCForm] = useState(false);

  const handleAssignCRC = async () => {
    if (!crcEmail.endsWith("@nitsri.ac.in")) {
      alert("Please use a valid @nitsri.ac.in email");
      return;
    }
    try {
      await assignCRC({ variables: { email: crcEmail } });
      alert("CRC assigned successfully!");
      setCrcEmail("");
      setShowCRCForm(false);
      refetchStats();
      refetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveCRC = async (email, name) => {
    const confirmed = await confirm(`Remove CRC role from ${name}?`, "Confirm Remove CRC", "admin");
    if (confirmed) {
      try {
        await removeCRC({ variables: { email } });
        refetchStudents();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirm("Are you sure you want to log out?", "Confirm Logout", "admin");
    if (confirmed) {
      logout();
      navigate("/auth");
    }
  };

  const navLinks = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Companies", path: "/admin/companies", icon: Building2 },
    { name: "CRC", path: "/admin/crc", icon: Shield },
    { name: "Stats", path: "/admin/stats", icon: TrendingUp },
  ];

  const StatCard = ({ label, value, subtext, icon: Icon }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-blue-50 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
        </div>
      </div>
    </div>
  );

  const avatar = user?.name
    ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=3B82F6&fontSize=40&textColor=ffffff`
    : "https://api.dicebear.com/9.x/initials/svg?seed=A&backgroundColor=3B82F6&fontSize=40&textColor=ffffff";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Admin Panel</h2>
              <p className="text-xs text-gray-500">NIT Srinagar</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.path.split('/').pop();
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-gray-50 rounded-lg">
            <img src={avatar} alt="" className="w-9 h-9 rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Training & Placement Cell · NIT Srinagar</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-700">System Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              <StatCard label="Students" value={stats.totalStudents} icon={Users} />
              <StatCard label="Companies" value={stats.totalCompanies} icon={Building2} />
              <StatCard label="Active Jobs" value={stats.activeJobs} icon={Target} />
              <StatCard label="Applications" value={stats.totalApplications} icon={Shield} />
              <StatCard
                label="Placement Rate"
                value={`${stats.placementPercentage.toFixed(1)}%`}
                subtext={`${Math.round(stats.totalStudents * stats.placementPercentage / 100)} placed`}
                icon={TrendingUp}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Recent Companies</h3>
                  <Link to="/admin/companies" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {companies.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No companies registered</p>
                  ) : (
                    companies.slice(0, 5).map((company) => (
                      <div key={company.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{company.name}</p>
                            <p className="text-xs text-gray-500">{company.assignedCRC?.name || "Unassigned"}</p>
                          </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-2">
                  <Link to="/admin/crc" className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="p-2.5 bg-blue-50 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Assign CRC</p>
                      <p className="text-xs text-gray-500">Manage CRC members</p>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link to="/admin/companies" className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="p-2.5 bg-green-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Manage Companies</p>
                      <p className="text-xs text-gray-500">View all companies</p>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link to="/admin/stats" className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="p-2.5 bg-purple-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Placement Statistics</p>
                      <p className="text-xs text-gray-500">View placement data</p>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link to="/admin/users" className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="p-2.5 bg-orange-50 rounded-lg">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Manage Users</p>
                      <p className="text-xs text-gray-500">View all users</p>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "crc" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CRC Management</h1>
              <p className="text-sm text-gray-500 mt-1">Assign or remove CRC role from students</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">CRC Members</h3>
                    <p className="text-xs text-gray-500">{students.filter(s => s.role === 'CRC').length} assigned</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCRCForm(!showCRCForm)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Assign CRC
                </button>
              </div>

              {showCRCForm && (
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="student@nitsri.ac.in"
                      value={crcEmail}
                      onChange={(e) => setCrcEmail(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleAssignCRC}
                      className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => { setShowCRCForm(false); setCrcEmail(""); }}
                      className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CGPA</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Companies</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.filter(s => s.role === 'CRC').map((crc) => (
                      <tr key={crc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-semibold">
                              {crc.name?.charAt(0) || 'C'}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{crc.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{crc.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{crc.cgpa}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {companies.filter(c => c.assignedCRC?.id === crc.id).length > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
                              {companies.filter(c => c.assignedCRC?.id === crc.id).length} assigned
                            </span>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleRemoveCRC(crc.email, crc.name)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.filter(s => s.role === 'CRC').length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <Shield className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">No CRC members assigned yet</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "companies" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
              <p className="text-sm text-gray-500 mt-1">Manage registered companies</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned CRC</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {companies.map((company) => (
                      <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-gray-500" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{company.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{company.description}</td>
                        <td className="px-6 py-4">
                          {company.assignedCRC ? (
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">{company.assignedCRC.name}</span>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(company.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {companies.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">No companies registered yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Placement Statistics</h1>
              <p className="text-sm text-gray-500 mt-1">Overall placement overview</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard label="Total Students" value={stats.totalStudents} icon={Users} />
              <StatCard label="Placed" value={Math.round(stats.totalStudents * stats.placementPercentage / 100)} icon={Check} />
              <StatCard label="Companies" value={stats.totalCompanies} icon={Building2} />
              <StatCard label="Placement Rate" value={`${stats.placementPercentage.toFixed(1)}%`} icon={TrendingUp} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Placement Progress</h3>
              <div className="relative h-10 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500 flex items-center justify-end pr-4"
                  style={{ width: `${stats.placementPercentage}%` }}
                >
                  <span className="text-sm font-bold text-white">{stats.placementPercentage.toFixed(1)}%</span>
                </div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                {stats.totalStudents > 0
                  ? `${Math.round(stats.totalStudents * stats.placementPercentage / 100)} out of ${stats.totalStudents} students placed`
                  : "No students registered yet"}
              </p>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-500 mt-1">View and manage all registered users</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enrollment</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                              user.role === 'ADMIN' ? 'bg-blue-600' :
                              user.role === 'CRC' ? 'bg-green-600' :
                              'bg-gray-400'
                            }`}>
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                            user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700' :
                            user.role === 'CRC' ? 'bg-green-50 text-green-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{user.enrollmentNumber || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{user.cgpa || "—"}</td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">No users found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
