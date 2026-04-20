import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
  Search,
  Check,
  Shield,
  AlertCircle,
} from "../../components/Icons";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split('/').pop() || "dashboard";

  // Queries
  const { data: statsData, refetch: refetchStats } = useQuery(GET_DASHBOARD_STATS);
  const { data: companiesData } = useQuery(GET_COMPANIES);
  const { data: studentsData, refetch: refetchStudents } = useQuery(GET_STUDENTS);

  // Mutations
  const [assignCRC] = useMutation(ASSIGN_CRC);
  const [removeCRC] = useMutation(REMOVE_CRC);

  const stats = statsData?.dashboardStats || { totalStudents: 0, totalCompanies: 0, activeJobs: 0, totalApplications: 0, placementPercentage: 0 };
  const companies = companiesData?.companies || [];
  const students = studentsData?.students || [];

  // CRC Assignment form
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

  const handleRemoveCRC = async (email) => {
    try {
      await removeCRC({ variables: { email } });
      refetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const navLinks = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Companies", path: "/admin/companies", icon: Building2 },
    { name: "CRC Management", path: "/admin/crc", icon: Shield },
    { name: "Placement Stats", path: "/admin/stats", icon: TrendingUp },
  ];

  const StatCard = ({ label, value, subtext }) => (
    <div className="bg-white border border-zinc-100 rounded-xl p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold text-zinc-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-zinc-400 mt-1">{subtext}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="w-60 bg-zinc-900 min-h-screen flex flex-col">
        <div className="p-5 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white tracking-tight">Admin Panel</h2>
          <p className="text-xs text-zinc-500 mt-0.5">NIT Srinagar</p>
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.path.split('/').pop();
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
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

        <div className="p-3 border-t border-zinc-800">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-zinc-500">Logged in as</p>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
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

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-zinc-500 mt-1">Training & Placement Cell · NIT Srinagar</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Total Students" value={stats.totalStudents} />
              <StatCard label="Companies" value={stats.totalCompanies} />
              <StatCard label="Active Jobs" value={stats.activeJobs} />
              <StatCard label="Applications" value={stats.totalApplications} />
              <StatCard label="Placement Rate" value={`${stats.placementPercentage.toFixed(1)}%`} subtext={`${Math.round(stats.totalStudents * stats.placementPercentage / 100)} placed`} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Companies */}
              <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">Companies</h3>
                  <Link to="/admin/companies" className="text-sm text-zinc-500 hover:text-zinc-900">View all</Link>
                </div>
                <div className="p-5">
                  {companies.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">No companies registered</p>
                  ) : (
                    <div className="space-y-2">
                      {companies.slice(0, 5).map((company) => (
                        <div key={company.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{company.name}</p>
                            <p className="text-xs text-zinc-500">{company.assignedCRC?.name || "Unassigned"}</p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <h3 className="text-sm font-semibold text-zinc-900">Quick Actions</h3>
                </div>
                <div className="p-5 space-y-2">
                  <Link to="/admin/crc" className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                    <span className="text-sm font-medium text-zinc-700">Assign CRC</span>
                    <Shield className="w-4 h-4 text-zinc-400" />
                  </Link>
                  <Link to="/admin/companies" className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                    <span className="text-sm font-medium text-zinc-700">Manage Companies</span>
                    <Building2 className="w-4 h-4 text-zinc-400" />
                  </Link>
                  <Link to="/admin/stats" className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                    <span className="text-sm font-medium text-zinc-700">Placement Statistics</span>
                    <TrendingUp className="w-4 h-4 text-zinc-400" />
                  </Link>
                  <Link to="/admin/users" className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                    <span className="text-sm font-medium text-zinc-700">Manage Users</span>
                    <Users className="w-4 h-4 text-zinc-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CRC Management Tab */}
        {activeTab === "crc" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">CRC Management</h1>
              <p className="text-sm text-zinc-500 mt-1">Assign or remove CRC role from students</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* CRC List */}
              <div className="xl:col-span-2 bg-white border border-zinc-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    CRC Members ({students.filter(s => s.role === 'CRC').length})
                  </h3>
                  <button
                    onClick={() => setShowCRCForm(!showCRCForm)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Assign CRC
                  </button>
                </div>

                {showCRCForm && (
                  <div className="p-5 border-b border-zinc-100 bg-zinc-50">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="student@nitsri.ac.in"
                        value={crcEmail}
                        onChange={(e) => setCrcEmail(e.target.value)}
                        className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                      />
                      <button
                        onClick={handleAssignCRC}
                        className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => { setShowCRCForm(false); setCrcEmail(""); }}
                        className="px-3 py-2 text-zinc-500 hover:text-zinc-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Name</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Email</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">CGPA</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Companies</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {students.filter(s => s.role === 'CRC').map((crc) => (
                        <tr key={crc.id} className="hover:bg-zinc-50">
                          <td className="px-5 py-4 text-sm font-medium text-zinc-900">{crc.name}</td>
                          <td className="px-5 py-4 text-sm text-zinc-500">{crc.email}</td>
                          <td className="px-5 py-4 text-sm text-zinc-700">{crc.cgpa}</td>
                          <td className="px-5 py-4">
                            {companies.filter(c => c.assignedCRC?.id === crc.id).length > 0 ? (
                              <span className="text-sm text-zinc-600">{companies.filter(c => c.assignedCRC?.id === crc.id).length} assigned</span>
                            ) : (
                              <span className="text-sm text-zinc-400">None</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => {
                                if (confirm(`Remove CRC role from ${crc.name}?`)) {
                                  handleRemoveCRC(crc.email);
                                }
                              }}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {students.filter(s => s.role === 'CRC').length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-5 py-8 text-center text-sm text-zinc-500">
                            No CRC members assigned yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5 h-fit">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-600 mb-4">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">About CRC Role</h3>
                <ul className="space-y-2 text-sm text-zinc-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <span>Campus Recruitment Coordinator</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <span>Can add companies and jobs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <span>Can review applicants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <span>Admin assigns/removes role</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === "companies" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Companies</h1>
              <p className="text-sm text-zinc-500 mt-1">Manage registered companies</p>
            </div>

            <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Company</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Description</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Assigned CRC</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {companies.map((company) => (
                      <tr key={company.id} className="hover:bg-zinc-50">
                        <td className="px-5 py-4 text-sm font-medium text-zinc-900">{company.name}</td>
                        <td className="px-5 py-4 text-sm text-zinc-500 max-w-xs truncate">{company.description}</td>
                        <td className="px-5 py-4">
                          {company.assignedCRC ? (
                            <span className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg">
                              {company.assignedCRC.name}
                            </span>
                          ) : (
                            <span className="text-sm text-zinc-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-zinc-500">
                          {new Date(company.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {companies.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-5 py-8 text-center text-sm text-zinc-500">
                          No companies registered yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Placement Statistics</h1>
              <p className="text-sm text-zinc-500 mt-1">Overall placement overview</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Students" value={stats.totalStudents} />
              <StatCard label="Placed Students" value={Math.round(stats.totalStudents * stats.placementPercentage / 100)} />
              <StatCard label="Total Companies" value={stats.totalCompanies} />
              <StatCard label="Placement Rate" value={`${stats.placementPercentage.toFixed(1)}%`} />
            </div>

            <div className="bg-white border border-zinc-100 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Placement Progress</h3>
              <div className="relative h-8 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-zinc-900 rounded-full transition-all duration-500"
                  style={{ width: `${stats.placementPercentage}%` }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                    {stats.placementPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-center text-sm text-zinc-500 mt-4">
                {stats.totalStudents > 0
                  ? `${Math.round(stats.totalStudents * stats.placementPercentage / 100)} out of ${stats.totalStudents} students placed`
                  : "No students registered yet"}
              </p>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">User Management</h1>
              <p className="text-sm text-zinc-500 mt-1">View and manage all registered users</p>
            </div>

            <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Role</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Enrollment</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">CGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {students.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-50">
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-zinc-900">{user.name}</span>
                          <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded ${
                            user.role === 'ADMIN' ? 'bg-violet-50 text-violet-700' :
                            user.role === 'CRC' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-zinc-100 text-zinc-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-zinc-500">{user.email}</td>
                        <td className="px-5 py-4 text-sm text-zinc-600">{user.role}</td>
                        <td className="px-5 py-4 text-sm text-zinc-500 font-mono">{user.enrollmentNumber || "N/A"}</td>
                        <td className="px-5 py-4 text-sm text-zinc-700">{user.cgpa || "N/A"}</td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-5 py-8 text-center text-sm text-zinc-500">
                          No users found
                        </td>
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
