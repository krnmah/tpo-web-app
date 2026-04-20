import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../../components/ConfirmDialog";
import { GET_COMPANIES, GET_MY_ASSIGNED_COMPANIES, CREATE_MY_COMPANY, UPDATE_COMPANY } from "../../graphql/queries";
import { GET_JOBS, CREATE_JOB, CLOSE_JOB } from "../../graphql/queries";
import { GET_APPLICATIONS_BY_COMPANY, UPDATE_APPLICATION_STATUS } from "../../graphql/queries";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  FileText,
  Plus,
  LogOut,
  SwitchHorizontal,
  Users,
  TrendingUp,
  Check,
  X,
  ChevronDown,
} from "../../components/Icons";

const CRCDashboard = () => {
  const { user, activeRole, toggleRole, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const isStudentMode = activeRole === 'STUDENT';

  const handleLogout = async () => {
    const confirmed = await confirm(
      "Are you sure you want to log out?",
      "Confirm Logout",
      "crc"
    );
    if (confirmed) {
      logout();
      navigate("/auth");
    }
  };

  // Queries
  const { data: companiesData, refetch: refetchCompanies, error: companiesError } = useQuery(GET_MY_ASSIGNED_COMPANIES, {
    fetchPolicy: "network-only"
  });
  const { data: allJobsData, refetch: refetchJobs, error: jobsError } = useQuery(GET_JOBS, {
    variables: { status: "OPEN" },
    fetchPolicy: "network-only"
  });

  const companies = companiesData?.myCompanies || [];
  const jobs = allJobsData?.jobs || [];

  // Mutations
  const [createMyCompany] = useMutation(CREATE_MY_COMPANY);
  const [createJob] = useMutation(CREATE_JOB);
  const [closeJob] = useMutation(CLOSE_JOB);
  const [updateApplicationStatus] = useMutation(UPDATE_APPLICATION_STATUS);

  // Forms
  const [newCompany, setNewCompany] = useState({ name: "", description: "" });
  const [newJob, setNewJob] = useState({
    title: "",
    companyId: "",
    description: "",
    minCgpa: "",
    requiredSkills: []
  });

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompany.name.trim()) {
      alert('Company name is required.');
      return;
    }
    if (newCompany.description.length < 10) {
      alert('Description must be at least 10 characters.');
      return;
    }
    try {
      const result = await createMyCompany({
        variables: { name: newCompany.name, description: newCompany.description }
      });
      if (result.errors?.length > 0) {
        alert(result.errors[0].message);
        return;
      }
      setNewCompany({ name: "", description: "" });
      setShowCompanyForm(false);
      refetchCompanies();
      alert('Company added successfully!');
    } catch (err) {
      alert(err.message || 'Failed to add company');
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || newJob.title.length < 3) {
      alert("Job title must be at least 3 characters.");
      return;
    }
    if (!newJob.companyId) {
      alert("Please select a company.");
      return;
    }
    const minCgpa = parseFloat(newJob.minCgpa);
    if (isNaN(minCgpa) || minCgpa < 0 || minCgpa > 10) {
      alert("Please enter a valid CGPA (0-10).");
      return;
    }
    if (!newJob.requiredSkills?.length) {
      alert("Please enter at least one skill.");
      return;
    }
    try {
      const result = await createJob({
        variables: {
          input: {
            title: newJob.title,
            companyId: parseInt(newJob.companyId),
            description: newJob.description,
            minCgpa: minCgpa,
            requiredSkills: newJob.requiredSkills
          }
        }
      });
      if (result.errors?.length > 0) {
        alert(result.errors[0].message);
        return;
      }
      setNewJob({ title: "", companyId: "", description: "", minCgpa: "", requiredSkills: [] });
      setShowJobForm(false);
      refetchJobs();
      alert("Job posted successfully!");
    } catch (err) {
      alert(err.message || "Failed to post job");
    }
  };

  const navLinks = [
    { name: "Overview", tab: "overview", icon: LayoutDashboard },
    { name: "My Companies", tab: "companies", icon: Building2 },
    { name: "Manage Jobs", tab: "jobs", icon: Briefcase },
    { name: "Applications", tab: "applications", icon: FileText },
  ];

  const StatCard = ({ label, value }) => (
    <div className="bg-white border border-slate-100 rounded-xl p-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-3xl opacity-60"></div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );

  const avatar = user?.name
    ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=4f46e5&fontSize=40&textColor=ffffff`
    : "https://api.dicebear.com/9.x/initials/svg?seed=C&backgroundColor=4f46e5&fontSize=40&textColor=ffffff";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-white tracking-tight">Training & Placement</h2>
          <p className="text-xs text-slate-400 mt-0.5">NIT Srinagar</p>
        </div>

        {/* Mode Toggle */}
        <div className="p-3 border-b border-slate-700/50">
          <button
            onClick={() => {
              toggleRole();
              navigate(isStudentMode ? "/crc/dashboard" : "/student/dashboard");
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <span className="text-xs font-medium text-slate-300">
              {isStudentMode ? "Student View" : "CRC View"}
            </span>
            <SwitchHorizontal className="w-4 h-4 text-indigo-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.tab}>
                  <button
                    onClick={() => setActiveTab(link.tab)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === link.tab
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <img
              src={avatar}
              alt="Avatar"
              className="w-8 h-8 rounded-full bg-slate-800"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'CRC'}</p>
              <p className="text-xs text-slate-500 truncate">
                {isStudentMode ? "Student" : "CRC"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Overview</h1>
              <p className="text-sm text-zinc-500 mt-1">Training & Placement Cell · NIT Srinagar</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Assigned Companies" value={companies.length} />
              <StatCard label="Active Jobs" value={jobs.filter(j => j.status === "OPEN").length} />
              <StatCard label="Total Applicants" value={jobs.reduce((sum, j) => sum + (j._applicationCount || 0), 0)} />
              <StatCard label="Open Positions" value={jobs.filter(j => j.status === "OPEN").length} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Companies */}
              <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <h3 className="text-sm font-semibold text-zinc-900">My Companies</h3>
                </div>
                <div className="p-5">
                  {companies.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">No companies assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {companies.map((company) => (
                        <div key={company.id} className="p-3 border border-zinc-100 rounded-lg">
                          <p className="text-sm font-medium text-zinc-900">{company.name}</p>
                          <p className="text-xs text-zinc-500 mt-1">{company.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Jobs */}
              <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <h3 className="text-sm font-semibold text-zinc-900">Recent Jobs</h3>
                </div>
                <div className="p-5">
                  {jobs.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">No jobs posted</p>
                  ) : (
                    <div className="space-y-2">
                      {jobs.slice(0, 5).map((job) => (
                        <div key={job.id} className="p-3 border border-zinc-100 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{job.title}</p>
                              <p className="text-xs text-zinc-500 mt-1">{job.company?.name}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              job.status === "OPEN" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                            }`}>
                              {job.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === "companies" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">My Companies</h1>
                <p className="text-sm text-zinc-500 mt-1">Manage your assigned companies</p>
              </div>
              <button
                onClick={() => setShowCompanyForm(!showCompanyForm)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Company
              </button>
            </div>

            {showCompanyForm && (
              <div className="bg-white border border-zinc-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-zinc-900">Add New Company</h3>
                  <button onClick={() => setShowCompanyForm(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateCompany} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description (min 10 characters)"
                    value={newCompany.description}
                    onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                    className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <button type="submit" className="bg-indigo-600 text-white py-2 text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Add Company
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <div key={company.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{company.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{company.description}</p>
                  <p className="text-xs text-slate-400 mt-3">Assigned to you</p>
                </div>
              ))}
              {companies.length === 0 && (
                <div className="col-span-full bg-white border border-slate-100 rounded-xl p-12 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm text-slate-500">No companies assigned yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Manage Jobs</h1>
                <p className="text-sm text-zinc-500 mt-1">Create and manage job postings</p>
              </div>
              <button
                onClick={() => setShowJobForm(!showJobForm)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Post Job
              </button>
            </div>

            {showJobForm && (
              <div className="bg-white border border-zinc-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-zinc-900">Post New Job</h3>
                  <button onClick={() => setShowJobForm(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      required
                    />
                    <select
                      value={newJob.companyId}
                      onChange={(e) => setNewJob({ ...newJob, companyId: e.target.value })}
                      className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                      required
                    >
                      <option value="">Select Company</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="Min CGPA (0-10)"
                      value={newJob.minCgpa}
                      onChange={(e) => setNewJob({ ...newJob, minCgpa: e.target.value })}
                      className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Skills (comma separated)"
                      value={newJob.requiredSkills.join(",")}
                      onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value.split(",").map(s => s.trim()).filter(s => s) })}
                      className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      required
                    />
                  </div>
                  <textarea
                    placeholder="Job Description"
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                    rows="2"
                  />
                  <button type="submit" className="bg-indigo-600 text-white py-2 px-6 text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Post Job
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h3 className="text-sm font-semibold text-zinc-900">All Jobs</h3>
              </div>
              <div className="divide-y divide-zinc-100">
                {jobs.map((job) => (
                  <div key={job.id} className="p-5 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-zinc-900">{job.title}</h4>
                        <p className="text-sm text-zinc-500">{job.company?.name}</p>
                        <p className="text-xs text-zinc-400 mt-2">Min CGPA: {job.minCgpa} · Skills: {job.requiredSkills?.join(", ")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                          job.status === "OPEN" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                        }`}>
                          {job.status}
                        </span>
                        {job.status === "OPEN" && (
                          <button
                            onClick={async () => {
                              const confirmed = await confirm("Close this job?", "Confirm Action", "crc");
                              if (confirmed) {
                                await closeJob({ variables: { id: job.id } });
                                refetchJobs();
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-3">{job._applicationCount || 0} applicants</p>
                  </div>
                ))}
                {jobs.length === 0 && (
                  <div className="p-12 text-center">
                    <Briefcase className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-sm text-zinc-500">No jobs posted yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Applications</h1>
              <p className="text-sm text-zinc-500 mt-1">Review and manage applications</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company.id)}
                  className={`p-5 bg-white border rounded-xl text-left transition-all ${
                    selectedCompany === company.id
                      ? "border-indigo-600 shadow-md shadow-indigo-200 ring-2 ring-indigo-100"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{company.name}</p>
                  <p className="text-xs text-slate-500 mt-1">View applications</p>
                </button>
              ))}
              {companies.length === 0 && (
                <div className="col-span-full bg-white border border-slate-100 rounded-xl p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm text-slate-500">No companies to view applications for</p>
                </div>
              )}
            </div>

            {selectedCompany && (
              <CompanyApplications
                companyId={selectedCompany}
                updateApplicationStatus={updateApplicationStatus}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const CompanyApplications = ({ companyId, updateApplicationStatus }) => {
  const { data, refetch, error: applicationsError } = useQuery(GET_APPLICATIONS_BY_COMPANY, {
    variables: { companyId },
    fetchPolicy: "network-only"
  });
  const applications = data?.applicationsByCompany || [];

  const handleStatusChange = async (applicationId, status) => {
    try {
      await updateApplicationStatus({ variables: { applicationId, status } });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      APPLIED: "bg-zinc-100 text-zinc-700 border-zinc-200",
      SHORTLISTED: "bg-sky-50 text-sky-700 border-sky-100",
      SELECTED: "bg-emerald-50 text-emerald-700 border-emerald-100",
      REJECTED: "bg-red-50 text-red-700 border-red-100",
    };
    return styles[status] || styles.APPLIED;
  };

  return (
    <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="text-sm font-semibold text-zinc-900">Applications</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Student</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Enrollment</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">CGPA</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Status</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-zinc-50">
                <td className="px-5 py-4 text-sm font-medium text-zinc-900">{app.student?.name}</td>
                <td className="px-5 py-4 text-sm text-zinc-500 font-mono">{app.student?.enrollmentNumber}</td>
                <td className="px-5 py-4 text-sm text-zinc-700">{app.student?.cgpa}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${getStatusBadge(app.status)}`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="px-3 py-1.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="SHORTLISTED">Shortlist</option>
                    <option value="SELECTED">Select</option>
                    <option value="REJECTED">Reject</option>
                  </select>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-sm text-zinc-500">
                  No applications yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CRCDashboard;
