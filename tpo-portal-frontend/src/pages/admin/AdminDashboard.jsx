import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { GET_COMPANIES, GET_DASHBOARD_STATS, GET_STUDENTS } from "../../graphql/queries";
import { ASSIGN_CRC, REMOVE_CRC } from "../../graphql/queries";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  // Get active tab from current path
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

  // CRC Assignment form
  const [crcEmail, setCrcEmail] = useState("");

  const handleAssignCRC = async () => {
    if (!crcEmail.endsWith("@nitsri.ac.in")) {
      alert("Please use a valid @nitsri.ac.in email");
      return;
    }
    try {
      await assignCRC({ variables: { email: crcEmail } });
      alert("CRC assigned successfully!");
      setCrcEmail("");
      refetchStats();
      refetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveCRC = async () => {
    if (!crcEmail.endsWith("@nitsri.ac.in")) {
      alert("Please use a valid @nitsri.ac.in email");
      return;
    }
    try {
      await removeCRC({ variables: { email: crcEmail } });
      alert("CRC removed successfully!");
      setCrcEmail("");
      refetchStats();
      refetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/auth";
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 text-gray-800 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Admin</h2>
          <p className="text-sm text-gray-500 mt-1">NIT Srinagar</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link to="/admin/dashboard" className={`block px-3 py-2 rounded-lg ${activeTab === "dashboard" ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100 text-gray-700"}`}>
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin/users" className={`block px-3 py-2 rounded-lg ${activeTab === "users" ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100 text-gray-700"}`}>
                👥 Users
              </Link>
            </li>
            <li>
              <Link to="/admin/companies" className={`block px-3 py-2 rounded-lg ${activeTab === "companies" ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100 text-gray-700"}`}>
                🏢 Companies
              </Link>
            </li>
            <li>
              <Link to="/admin/crc" className={`block px-3 py-2 rounded-lg ${activeTab === "crc" ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100 text-gray-700"}`}>
                🎯 CRC Management
              </Link>
            </li>
            <li>
              <Link to="/admin/stats" className={`block px-3 py-2 rounded-lg ${activeTab === "stats" ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100 text-gray-700"}`}>
                📈 Placement Stats
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600">
            Logged in as <span className="font-semibold">{user?.name}</span>
          </p>
          <p className="text-xs text-gray-500">Admin • {user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-200 text-sm text-gray-600 mt-2"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Dashboard/Overview Tab */}
        {activeTab === "dashboard" && (
          <div>
            <p className="text-gray-500 mb-6">National Institute of Technology, Srinagar</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Companies</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalCompanies}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Active Jobs</p>
                <p className="text-3xl font-bold text-purple-600">{stats.activeJobs}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Applications</p>
                <p className="text-3xl font-bold text-orange-600">{stats.totalApplications}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Placement %</p>
                <p className="text-3xl font-bold text-teal-600">{stats.placementPercentage.toFixed(1)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">🏢 All Companies</h3>
                {companies.length === 0 ? (
                  <p className="text-gray-500">No companies registered yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {companies.map((company) => (
                      <div key={company.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <h4 className="font-medium">{company.name}</h4>
                        <p className="text-sm text-gray-500">{company.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          CRC: {company.assignedCRC?.name || "Not assigned"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
                <div className="space-y-3">
                  <Link to="/admin/crc" className="block px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    ✅ Assign CRC to student
                  </Link>
                  <Link to="/admin/companies" className="block px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    🏢 Manage Companies
                  </Link>
                  <Link to="/admin/stats" className="block px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    📊 View Placement Statistics
                  </Link>
                  <Link to="/admin/users" className="block px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    👥 Manage All Users
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CRC Management Tab */}
        {activeTab === "crc" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">CRC Management</h1>
            <p className="text-gray-600 mb-6">Assign or remove CRC (Campus Recruitment Coordinator) role from students.</p>

            {/* CRC List */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">👥 CRC Members ({studentsData?.students?.filter(s => s.role === 'CRC').length || 0})</h3>
              {studentsData?.students?.filter(s => s.role === 'CRC').length === 0 ? (
                <p className="text-gray-500">No CRC members assigned yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Enrollment</th>
                        <th className="text-left py-3 px-4">CGPA</th>
                        <th className="text-left py-3 px-4">Assigned Companies</th>
                        <th className="text-left py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsData?.students?.filter(s => s.role === 'CRC').map((crc) => (
                        <tr key={crc.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{crc.name}</td>
                          <td className="py-3 px-4">{crc.email}</td>
                          <td className="py-3 px-4 font-mono text-sm">{crc.enrollmentNumber}</td>
                          <td className="py-3 px-4">{crc.cgpa}</td>
                          <td className="py-3 px-4">
                            {companies.filter(c => c.assignedCRC?.id === crc.id).length > 0 ? (
                              companies.filter(c => c.assignedCRC?.id === crc.id).map(c => (
                                <span key={c.id} className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                                  {c.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={async () => {
                                setCrcEmail(crc.email);
                                if (confirm(`Remove CRC role from ${crc.name}?`)) {
                                  try {
                                    await removeCRC({ variables: { email: crc.email } });
                                    refetchStudents();
                                  } catch (err) {
                                    alert(err.message);
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Assign CRC Form */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">➕ Assign New CRC</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="student@nitsri.ac.in"
                  value={crcEmail}
                  onChange={(e) => setCrcEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button onClick={handleAssignCRC} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                  Assign CRC
                </button>
                <button onClick={handleRemoveCRC} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
                  Remove CRC
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Enter student email to assign them as CRC coordinator.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-blue-800 mb-2">ℹ️ About CRC Role</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• CRC = Campus Recruitment Coordinator (student + manager role)</li>
                <li>• CRC can add companies and jobs for their assigned companies</li>
                <li>• CRC can review and shortlist applicants</li>
                <li>• Admin assigns/removes CRC role from any student</li>
              </ul>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === "companies" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Companies</h1>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">🏢 All Registered Companies</h3>
              {companies.length === 0 ? (
                <p className="text-gray-500">No companies registered yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Company</th>
                        <th className="text-left py-3 px-4">Description</th>
                        <th className="text-left py-3 px-4">Assigned CRC</th>
                        <th className="text-left py-3 px-4">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((company) => (
                        <tr key={company.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{company.name}</td>
                          <td className="py-3 px-4 text-gray-600">{company.description}</td>
                          <td className="py-3 px-4">
                            {company.assignedCRC ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                                {company.assignedCRC.name}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-sm">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Placement Statistics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Total Students</p>
                <p className="text-4xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Placed Students</p>
                <p className="text-4xl font-bold text-green-600">
                  {Math.round(stats.totalStudents * stats.placementPercentage / 100)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Total Companies</p>
                <p className="text-4xl font-bold text-purple-600">{stats.totalCompanies}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Placement Rate</p>
                <p className="text-4xl font-bold text-teal-600">{stats.placementPercentage.toFixed(1)}%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Placement Overview</h3>
              <div className="w-full bg-gray-200 rounded-full h-8 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-teal-500 h-8 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ width: `${stats.placementPercentage}%` }}
                >
                  {stats.placementPercentage.toFixed(1)}%
                </div>
              </div>
              <p className="text-center text-gray-600">
                {stats.totalStudents > 0
                  ? `${Math.round(stats.totalStudents * stats.placementPercentage / 100)} out of ${stats.totalStudents} students placed`
                  : "No students registered yet"}
              </p>
            </div>
          </div>
        )}

        {/* Users Tab - Placeholder for now */}
        {activeTab === "users" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">User Management</h1>
            <p className="text-gray-600 mb-4">View and manage all registered students and CRC members.</p>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">👥 All Users</h3>
              {studentsData?.loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : studentsData?.error ? (
                <p className="text-red-500">Failed to load users.</p>
              ) : studentsData?.students?.length === 0 ? (
                <p className="text-gray-500">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Role</th>
                        <th className="text-left py-3 px-4">Enrollment</th>
                        <th className="text-left py-3 px-4">CGPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsData?.students?.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-medium">{user.name}</span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded ${
                              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                              user.role === 'CRC' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">{user.role}</td>
                          <td className="py-3 px-4 font-mono text-sm">{user.enrollmentNumber || "N/A"}</td>
                          <td className="py-3 px-4">{user.cgpa || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
