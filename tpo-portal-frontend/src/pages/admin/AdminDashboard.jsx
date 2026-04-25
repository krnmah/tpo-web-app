import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../components/ConfirmDialog";
import { GET_COMPANIES, GET_DASHBOARD_STATS, GET_STUDENTS, GET_PLACED_STUDENTS } from "../../graphql/queries";
import { ASSIGN_CRC, REMOVE_CRC, CREATE_COMPANY, UPDATE_COMPANY, DELETE_COMPANY } from "../../graphql/queries";
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
  Pencil,
  Trash2,
} from "../../components/Icons";

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  // Helper to safely format dates
  const formatDate = (dateValue) => {
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const activeTab = location.pathname.split('/').pop() || "dashboard";

  const { data: statsData, refetch: refetchStats } = useQuery(GET_DASHBOARD_STATS, { fetchPolicy: "network-only" });
  const { data: companiesData, refetch: refetchCompanies } = useQuery(GET_COMPANIES, { fetchPolicy: "cache-and-network" });
  const { data: studentsData, refetch: refetchStudents } = useQuery(GET_STUDENTS, { fetchPolicy: "network-only" });

  const [assignCRC] = useMutation(ASSIGN_CRC);
  const [removeCRC] = useMutation(REMOVE_CRC);
  const [createCompany] = useMutation(CREATE_COMPANY);
  const [updateCompany] = useMutation(UPDATE_COMPANY);
  const [deleteCompany] = useMutation(DELETE_COMPANY);

  const stats = statsData?.dashboardStats || { totalStudents: 0, totalCompanies: 0, activeJobs: 0, totalApplications: 0, placementPercentage: 0 };
  const companies = companiesData?.companies || [];
  const students = studentsData?.students || [];

  const [crcEmail, setCrcEmail] = useState("");
  const [showCRCForm, setShowCRCForm] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [searchEnrollment, setSearchEnrollment] = useState("");
  const [statsBranchFilter, setStatsBranchFilter] = useState("All");

  // Company CRC assignment state
  const [companyName, setCompanyName] = useState("");
  const [assignCrcId, setAssignCrcId] = useState("");
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Edit company state
  const [editingCompany, setEditingCompany] = useState(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editAssignCrcId, setEditAssignCrcId] = useState("");

  // Check if enrollment has drop year pattern (contains dash like "2021-22bcse023")
  const isDropYear = (enrollmentNumber) => {
    if (!enrollmentNumber) return false;
    return enrollmentNumber.includes('-');
  };

  // Extract batch display from enrollment number
  // Normal: "2024bcse024" → "2024"
  // Drop year: "2021-22bcse023" → "2021-22"
  const getBatch = (enrollmentNumber) => {
    if (!enrollmentNumber || enrollmentNumber.length < 4) return null;

    // Check if it's a drop year enrollment
    const dashIndex = enrollmentNumber.indexOf('-');
    if (dashIndex > 0) {
      // Extract "2021-22" from "2021-22bcse023"
      const yearPart = enrollmentNumber.substring(0, dashIndex + 3); // "2021-22"
      return yearPart;
    }

    // Normal enrollment - extract first 4 characters
    const year = enrollmentNumber.substring(0, 4);
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2030) return null;
    return year;
  };

  // Get all unique batches from students
  const allBatches = [...new Set(students.map(s => getBatch(s.enrollmentNumber)).filter(Boolean))].sort().reverse();

  const { data: placedStudentsData } = useQuery(GET_PLACED_STUDENTS, {
    variables: { branch: statsBranchFilter === "All" ? null : statsBranchFilter },
    fetchPolicy: "network-only",
  });

  const placedStudents = placedStudentsData?.placedStudents || [];

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

  const handleAssignCRCToCompany = async () => {
    if (!companyName || !assignCrcId) {
      setToast({ show: true, message: 'Please enter company name and select a CRC member', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    try {
      await createCompany({
        variables: {
          input: {
            name: companyName,
            assignedCRC: parseInt(assignCrcId)
          }
        }
      });
      setToast({ show: true, message: 'Company created and CRC assigned successfully!', type: 'success' });
      setCompanyName("");
      setAssignCrcId("");
      setShowAssignForm(false);
      refetchCompanies();
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    } catch (err) {
      setToast({ show: true, message: err.message, type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    }
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setEditCompanyName(company.name);
    setEditAssignCrcId(company.assignedCRC?.id?.toString() || "");
  };

  const handleSaveEdit = async () => {
    if (!editCompanyName) {
      setToast({ show: true, message: 'Company name is required', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    try {
      await updateCompany({
        variables: {
          id: editingCompany.id,
          input: {
            name: editCompanyName,
            assignedCRC: editAssignCrcId ? parseInt(editAssignCrcId) : null
          }
        }
      });
      setToast({ show: true, message: 'Company updated successfully!', type: 'success' });
      setEditingCompany(null);
      setEditCompanyName("");
      setEditAssignCrcId("");
      refetchCompanies();
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    } catch (err) {
      setToast({ show: true, message: err.message, type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    }
  };

  const handleCancelEdit = () => {
    setEditingCompany(null);
    setEditCompanyName("");
    setEditAssignCrcId("");
  };

  const handleDeleteCompany = async (company) => {
    const confirmed = await confirm(
      `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
      "Delete Company",
      "admin"
    );
    if (confirmed) {
      try {
        await deleteCompany({ variables: { id: company.id } });
        setToast({ show: true, message: 'Company deleted successfully!', type: 'success' });
        refetchCompanies();
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
      } catch (err) {
        setToast({ show: true, message: err.message, type: 'error' });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
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

  // eslint-disable-next-line no-unused-vars
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
                <p className="text-sm text-gray-500 mt-1">Training & Placement Department · NIT Srinagar</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-700">System Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard label="Students" value={stats.totalStudents} icon={Users} />
              <StatCard label="Companies" value={stats.totalCompanies} icon={Building2} />
              <StatCard label="Active Jobs" value={stats.activeJobs} icon={Target} />
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
                        <div className={`w-2 h-2 rounded-full ${company.hasActiveJobs ? 'bg-green-500' : 'bg-red-500'}`} />
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
                <p className="text-sm text-gray-500 mt-1">Manage registered companies</p>
              </div>
              <button
                onClick={() => setShowAssignForm(!showAssignForm)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Shield className="w-4 h-4" />
                Assign CRC a Company
              </button>
            </div>

            {showAssignForm && (
              <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Assign CRC a Company</h3>
                      <p className="text-xs text-blue-100">Create a company and assign it to a CRC member</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowAssignForm(false); setCompanyName(""); setAssignCrcId(""); }}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Google, Microsoft, Amazon"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Shield className="w-4 h-4 text-gray-400" />
                        Assign to CRC
                      </label>
                      <select
                        value={assignCrcId}
                        onChange={(e) => setAssignCrcId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                      >
                        <option value="">Select a CRC member</option>
                        {students.filter(s => s.role === 'CRC').map((crc) => (
                          <option key={crc.id} value={crc.id}>
                            {crc.name} ({crc.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => { setShowAssignForm(false); setCompanyName(""); setAssignCrcId(""); }}
                      className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssignCRCToCompany}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Assign Company
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned CRC</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {editingCompany && (
                      <tr className="bg-blue-50/50">
                        <td className="px-6 py-4" colSpan="4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                              <input
                                type="text"
                                value={editCompanyName}
                                onChange={(e) => setEditCompanyName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Assigned CRC</label>
                              <select
                                value={editAssignCrcId}
                                onChange={(e) => setEditAssignCrcId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                              >
                                <option value="">Unassigned</option>
                                {students.filter(s => s.role === 'CRC').map((crc) => (
                                  <option key={crc.id} value={crc.id}>
                                    {crc.name} ({crc.email})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-md shadow-blue-500/20 transition-all"
                              >
                                <Check className="w-4 h-4" />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {companies.map((company) => (
                      <tr key={company.id} className={`hover:bg-gray-50 transition-colors ${editingCompany?.id === company.id ? 'hidden' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${company.hasActiveJobs ? 'bg-green-500' : 'bg-red-500'}`} title={company.hasActiveJobs ? 'Active postings' : 'No active postings'} />
                              <span className="text-sm font-medium text-gray-900">{company.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {company.assignedCRC ? (
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">{company.assignedCRC.name}</span>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(company.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditCompany(company)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit company"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCompany(company)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete company"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
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

            {/* Placed Students Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Placed Students</h3>
                    <p className="text-xs text-gray-500">{placedStudents.length} students placed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 font-medium">Branch:</label>
                  <select
                    value={statsBranchFilter}
                    onChange={(e) => setStatsBranchFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All Branches</option>
                    {[...new Set(students.map((s) => s.branch).filter(Boolean))].sort().map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enrollment</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CGPA</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Placed On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {placedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-sm font-semibold">
                              {student.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.branch || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{student.enrollmentNumber || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{student.cgpa || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                            <Building2 className="w-3 h-3" />
                            {student.companyName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(student.placedAt)}</td>
                      </tr>
                    ))}
                    {placedStudents.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <Check className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">No placed students found</p>
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

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-500 mt-1">View and manage all registered users</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search enrollment..."
                    value={searchEnrollment}
                    onChange={(e) => setSearchEnrollment(e.target.value)}
                    className="w-48 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchEnrollment && (
                    <button
                      onClick={() => setSearchEnrollment("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 font-medium">Branch:</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All</option>
                    {[...new Set(students.map((s) => s.branch).filter(Boolean))].sort().map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 font-medium">Batch:</label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All</option>
                    {allBatches.map((batch) => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                    <option value="drop-year">Drop Year Students</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enrollment</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Batch</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students
                      .filter(student => {
                        const branchMatch = selectedBranch === "All" || student.branch === selectedBranch;
                        const dropYear = isDropYear(student.enrollmentNumber);
                        const studentBatch = getBatch(student.enrollmentNumber);

                        let batchMatch = selectedBatch === "All";
                        if (selectedBatch === "drop-year") {
                          batchMatch = dropYear;
                        } else {
                          batchMatch = selectedBatch === "All" || studentBatch === selectedBatch;
                        }

                        const searchMatch = !searchEnrollment ||
                          (student.enrollmentNumber?.toLowerCase().includes(searchEnrollment.toLowerCase()));

                        return branchMatch && batchMatch && searchMatch;
                      })
                      .map((user) => {
                        const dropYear = isDropYear(user.enrollmentNumber);
                        return (
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
                        <td className="px-6 py-4 text-sm text-gray-600">{user.branch || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{user.enrollmentNumber || "—"}</td>
                        <td className="px-6 py-4">
                          {getBatch(user.enrollmentNumber) ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg ${
                                dropYear
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-purple-50 text-purple-700'
                              }`}>
                                {getBatch(user.enrollmentNumber)}
                              </span>
                              {dropYear && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-md" title="Drop Year Student">
                                  📌
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{user.cgpa || "—"}</td>
                      </tr>
                    );})}
                    {students.filter(student => {
                      const branchMatch = selectedBranch === "All" || student.branch === selectedBranch;
                      const dropYear = isDropYear(student.enrollmentNumber);
                      const studentBatch = getBatch(student.enrollmentNumber);

                      let batchMatch = selectedBatch === "All";
                      if (selectedBatch === "drop-year") {
                        batchMatch = dropYear;
                      } else {
                        batchMatch = selectedBatch === "All" || studentBatch === selectedBatch;
                      }

                      const searchMatch = !searchEnrollment ||
                        (student.enrollmentNumber?.toLowerCase().includes(searchEnrollment.toLowerCase()));

                      return branchMatch && batchMatch && searchMatch;
                    }).length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                          {searchEnrollment ? `No users found matching "${searchEnrollment}"` : "No users found"}
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

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl ${
            toast.type === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-red-500 to-rose-500'
          }`}>
            <div className="p-1.5 bg-white/20 rounded-lg">
              {toast.type === 'success' ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <X className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-sm font-medium text-white">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
