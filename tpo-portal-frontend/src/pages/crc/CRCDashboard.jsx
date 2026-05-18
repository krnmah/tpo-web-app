import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../../components/ConfirmDialog";
import { GET_MY_ASSIGNED_COMPANIES } from "../../graphql/queries";
import { GET_JOBS, CREATE_JOB, CLOSE_JOB, UPDATE_JOB, DELETE_JOB } from "../../graphql/queries";
import { GET_APPLICATIONS_BY_COMPANY, UPDATE_APPLICATION_STATUS } from "../../graphql/queries";
import { CREATE_MY_COMPANY } from "../../graphql/queries";
import { getSalaryDisplay, getRequiredFields, validateSalaryFields } from "../../utils/formatCurrency";
import * as XLSX from "xlsx";
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
  Pencil,
  Trash2,
} from "../../components/Icons";

const CRCDashboard = () => {
  const { user, activeRole, toggleRole, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const isStudentMode = activeRole === 'STUDENT';
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", description: "" });
  const [skillsInput, setSkillsInput] = useState("");

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
  const { data: companiesData, refetch: refetchCompanies } = useQuery(GET_MY_ASSIGNED_COMPANIES, {
    fetchPolicy: "network-only"
  });
  const { data: allJobsData, refetch: refetchJobs } = useQuery(GET_JOBS, {
    fetchPolicy: "network-only"
  });

  const companies = companiesData?.myCompanies || [];
  const jobs = allJobsData?.jobs || [];

  // Mutations
  const [createJob] = useMutation(CREATE_JOB);
  const [closeJob] = useMutation(CLOSE_JOB);
  const [updateJob] = useMutation(UPDATE_JOB);
  const [deleteJob] = useMutation(DELETE_JOB);
  const [updateApplicationStatus] = useMutation(UPDATE_APPLICATION_STATUS);
  const [createMyCompany] = useMutation(CREATE_MY_COMPANY);

  // Branches list (matching EditUserSlideOver.jsx)
  const BRANCHES = [
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science and Engineering",
    "Electrical Engineering",
    "Electronics and Communication Engineering",
    "Information Technology",
    "Mechanical Engineering",
    "Metallurgical and Materials Engineering"
  ];

  // Forms
  const [newJob, setNewJob] = useState({
    title: "",
    companyId: "",
    description: "",
    minCgpa: "",
    requiredSkills: [],
    eligibleBranches: [],
    jobType: "INTERN_ONLY",
    stipendAmount: "",
    ppoAmount: "",
    ctcAmount: ""
  });

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || newJob.title.length < 3) {
      setToast({ show: true, message: 'Job title must be at least 3 characters', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    if (!newJob.companyId) {
      setToast({ show: true, message: 'Please select a company', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    // Check if company already has an active job
    const existingJob = jobs.find(j => j.company?.id === parseInt(newJob.companyId) && j.status === 'OPEN');
    if (existingJob) {
      setToast({ show: true, message: 'This company already has an active job posting', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    const minCgpa = parseFloat(newJob.minCgpa);
    if (isNaN(minCgpa) || minCgpa < 0 || minCgpa > 10) {
      setToast({ show: true, message: 'Please enter a valid CGPA (0-10)', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    // Parse skills input into array
    const requiredSkills = skillsInput.split(",").map(s => s.trim()).filter(s => s.length > 0);
    if (!requiredSkills.length) {
      setToast({ show: true, message: 'Please enter at least one skill', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    if (!newJob.eligibleBranches?.length) {
      setToast({ show: true, message: 'Please select at least one eligible branch', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }

    // Validate salary fields based on job type
    const salaryData = {
      jobType: newJob.jobType,
      stipendAmount: newJob.stipendAmount ? parseFloat(newJob.stipendAmount) : null,
      ppoAmount: newJob.ppoAmount ? parseFloat(newJob.ppoAmount) : null,
      ctcAmount: newJob.ctcAmount ? parseFloat(newJob.ctcAmount) : null
    };
    const salaryValidation = validateSalaryFields(salaryData);
    if (!salaryValidation.valid) {
      setToast({ show: true, message: salaryValidation.error, type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
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
            requiredSkills: requiredSkills,
            eligibleBranches: newJob.eligibleBranches,
            jobType: newJob.jobType,
            stipendAmount: salaryData.stipendAmount,
            ppoAmount: salaryData.ppoAmount,
            ctcAmount: salaryData.ctcAmount
          }
        }
      });
      if (result.errors?.length > 0) {
        setToast({ show: true, message: result.errors[0].message, type: 'error' });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
        return;
      }
      setNewJob({
        title: "",
        companyId: "",
        description: "",
        minCgpa: "",
        requiredSkills: [],
        eligibleBranches: [],
        jobType: "INTERN_ONLY",
        stipendAmount: "",
        ppoAmount: "",
        ctcAmount: ""
      });
      setSkillsInput("");
      setShowJobForm(false);
      refetchJobs();
      setToast({ show: true, message: 'Job posted successfully! Eligible students have been notified.', type: 'success' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    } catch (err) {
      setToast({ show: true, message: err.message || 'Failed to post job', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setNewJob({
      title: job.title,
      companyId: job.company?.id?.toString(),
      description: job.description || "",
      minCgpa: job.minCgpa?.toString(),
      requiredSkills: job.requiredSkills || [],
      eligibleBranches: job.eligibleBranches || [],
      jobType: job.jobType || "INTERN_ONLY",
      stipendAmount: job.stipendAmount?.toString() || "",
      ppoAmount: job.ppoAmount?.toString() || "",
      ctcAmount: job.ctcAmount?.toString() || ""
    });
    setSkillsInput(job.requiredSkills ? job.requiredSkills.join(", ") : "");
    setShowJobForm(true);
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    if (!editingJob) return handleCreateJob(e);

    if (!newJob.title || newJob.title.length < 3) {
      setToast({ show: true, message: 'Job title must be at least 3 characters', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    const minCgpa = parseFloat(newJob.minCgpa);
    if (isNaN(minCgpa) || minCgpa < 0 || minCgpa > 10) {
      setToast({ show: true, message: 'Please enter a valid CGPA (0-10)', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    // Parse skills input into array
    const requiredSkills = skillsInput.split(",").map(s => s.trim()).filter(s => s.length > 0);
    if (!requiredSkills.length) {
      setToast({ show: true, message: 'Please enter at least one skill', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }
    if (!newJob.eligibleBranches?.length) {
      setToast({ show: true, message: 'Please select at least one eligible branch', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }

    // Validate salary fields based on job type
    const salaryData = {
      jobType: newJob.jobType,
      stipendAmount: newJob.stipendAmount ? parseFloat(newJob.stipendAmount) : null,
      ppoAmount: newJob.ppoAmount ? parseFloat(newJob.ppoAmount) : null,
      ctcAmount: newJob.ctcAmount ? parseFloat(newJob.ctcAmount) : null
    };
    const salaryValidation = validateSalaryFields(salaryData);
    if (!salaryValidation.valid) {
      setToast({ show: true, message: salaryValidation.error, type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }

    try {
      // Parse skills input into array
      const requiredSkills = skillsInput.split(",").map(s => s.trim()).filter(s => s.length > 0);
      const cgpaChanged = editingJob.minCgpa !== minCgpa;
      await updateJob({
        variables: {
          id: editingJob.id,
          input: {
            title: newJob.title,
            description: newJob.description,
            minCgpa: minCgpa,
            requiredSkills: requiredSkills,
            eligibleBranches: newJob.eligibleBranches,
            jobType: newJob.jobType,
            stipendAmount: salaryData.stipendAmount,
            ppoAmount: salaryData.ppoAmount,
            ctcAmount: salaryData.ctcAmount
          }
        }
      });
      setEditingJob(null);
      setNewJob({
        title: "",
        companyId: "",
        description: "",
        minCgpa: "",
        requiredSkills: [],
        eligibleBranches: [],
        jobType: "INTERN_ONLY",
        stipendAmount: "",
        ppoAmount: "",
        ctcAmount: ""
      });
      setSkillsInput("");
      setShowJobForm(false);
      refetchJobs();
      const message = cgpaChanged
        ? 'Job updated! Eligible students have been notified of the CGPA change.'
        : 'Job updated successfully!';
      setToast({ show: true, message, type: 'success' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    } catch (err) {
      setToast({ show: true, message: err.message || 'Failed to update job', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    }
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
    setNewJob({
      title: "",
      companyId: "",
      description: "",
      minCgpa: "",
      requiredSkills: [],
      eligibleBranches: [],
      jobType: "INTERN_ONLY",
      stipendAmount: "",
      ppoAmount: "",
      ctcAmount: ""
    });
    setSkillsInput("");
    setShowJobForm(false);
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();

    // Validation: name minimum 2 characters
    if (!newCompany.name || newCompany.name.length < 2) {
      setToast({ show: true, message: 'Company name must be at least 2 characters', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }

    // Validation: description minimum 10 characters
    if (!newCompany.description || newCompany.description.length < 10) {
      setToast({ show: true, message: 'Description must be at least 10 characters', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return;
    }

    try {
      const result = await createMyCompany({
        variables: {
          name: newCompany.name,
          description: newCompany.description
        }
      });

      if (result.errors?.length > 0) {
        setToast({ show: true, message: result.errors[0].message, type: 'error' });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
        return;
      }

      // Reset form and close
      setNewCompany({ name: "", description: "" });
      setShowCompanyForm(false);

      // Refetch companies to show the new one
      refetchCompanies();

      setToast({ show: true, message: 'Company created successfully! You can now post jobs for this company.', type: 'success' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    } catch (err) {
      setToast({ show: true, message: err.message || 'Failed to create company', type: 'error' });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    }
  };

  const handleDeleteJob = async (job) => {
    const confirmed = await confirm(
      `Are you sure you want to delete "${job.title}"? This will remove the job posting and all related data. This action cannot be undone.`,
      "Delete Job",
      "crc"
    );
    if (confirmed) {
      try {
        await deleteJob({ variables: { id: job.id } });
        refetchJobs();
        setToast({ show: true, message: 'Job deleted successfully', type: 'success' });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
      } catch (err) {
        setToast({ show: true, message: err.message || 'Failed to delete job', type: 'error' });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
      }
    }
  };

  const navLinks = [
    { name: "Overview", tab: "overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: "My Companies", tab: "companies", icon: <Building2 className="w-4 h-4" /> },
    { name: "Manage Jobs", tab: "jobs", icon: <Briefcase className="w-4 h-4" /> },
    { name: "Applications", tab: "applications", icon: <FileText className="w-4 h-4" /> },
  ];

  const StatCard = ({ label, value, icon }) => (
    <div className="bg-white border border-slate-100 rounded-xl p-5 relative overflow-hidden group hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-100/50 hover:border-indigo-100 transition-all duration-300 ease-out">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-3xl opacity-60 group-hover:from-indigo-100 group-hover:opacity-80 transition-all duration-300"></div>
      <div className="flex items-center gap-3">
        {icon && <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300">{icon}</div>}
        <div className="group-hover:translate-x-0.5 transition-transform duration-300">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
        </div>
      </div>
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
                    {link.icon}
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
              <p className="text-sm text-zinc-500 mt-1">Training & Placement Department · NIT Srinagar</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="My Companies" value={companies.length} icon={<Building2 className="w-5 h-5" />} />
              <StatCard label="Active Jobs" value={jobs.filter(j => j.status === "OPEN").length} icon={<Briefcase className="w-5 h-5" />} />
              <StatCard label="Total Applicants" value={jobs.reduce((sum, j) => sum + (j._applicationCount || 0), 0)} icon={<Users className="w-5 h-5" />} />
              <StatCard label="Open Positions" value={jobs.filter(j => j.status === "OPEN").length} icon={<TrendingUp className="w-5 h-5" />} />
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
                            <div className="flex-1">
                              <p className="text-sm font-medium text-zinc-900">{job.title}</p>
                              <p className="text-xs text-zinc-500 mt-1">{job.company?.name}</p>
                              {job.jobType && (
                                <p className="text-xs text-zinc-400 mt-1">
                                  {job.jobType.replace(/_/g, ' ')}
                                  {getSalaryDisplay(job) !== 'N/A' && ` · ${getSalaryDisplay(job)}`}
                                </p>
                              )}
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
                <p className="text-sm text-zinc-500 mt-1">Manage your companies</p>
              </div>
              <button
                onClick={() => setShowCompanyForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Company
              </button>
            </div>

            {/* Company Creation Form */}
            {showCompanyForm && (
              <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-xl shadow-md border border-indigo-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500">
                  <h3 className="text-sm font-semibold text-white">Create New Company</h3>
                  <button
                    onClick={() => setShowCompanyForm(false)}
                    className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleCreateCompany} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Google, Microsoft, Amazon"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">Description *</label>
                    <textarea
                      placeholder="Brief description about the company, industry, type of work..."
                      value={newCompany.description}
                      onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                      className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all placeholder:text-zinc-400"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCompanyForm(false);
                        setNewCompany({ name: "", description: "" });
                      }}
                      className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Create Company
                    </button>
                  </div>
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
                  <p className="text-sm text-slate-500 mb-4">No companies yet. Create your first company to get started!</p>
                  <button
                    onClick={() => setShowCompanyForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Company
                  </button>
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
              <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-xl shadow-md border border-indigo-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500">
                  <h3 className="text-sm font-semibold text-white">{editingJob ? 'Edit Job Posting' : 'Post New Job'}</h3>
                  <button onClick={handleCancelEdit} className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={editingJob ? handleUpdateJob : handleCreateJob} className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1.5">Job Title</label>
                      <input
                        type="text"
                        placeholder="e.g., Software Engineer"
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                        className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1.5">Company</label>
                      <select
                        value={newJob.companyId}
                        onChange={(e) => setNewJob({ ...newJob, companyId: e.target.value })}
                        className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all"
                        required
                        disabled={!!editingJob}
                      >
                        <option value="">Select Company</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1.5">Job Type *</label>
                      <select
                        value={newJob.jobType}
                        onChange={(e) => setNewJob({ ...newJob, jobType: e.target.value })}
                        className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all"
                        required
                      >
                        <option value="INTERN_ONLY">Intern Only</option>
                        <option value="INTERN_PPO">Intern + PPO</option>
                        <option value="INTERN_FTE">Intern + FTE</option>
                        <option value="FTE_ONLY">FTE Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1.5">Minimum CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        placeholder="e.g., 7.5"
                        value={newJob.minCgpa}
                        onChange={(e) => setNewJob({ ...newJob, minCgpa: e.target.value })}
                        className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
                        required
                      />
                    </div>

                    {/* Conditional Salary Fields */}
                    {getRequiredFields(newJob.jobType).stipend && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1.5">Stipend Amount (₹/month) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g., 50000"
                          value={newJob.stipendAmount}
                          onChange={(e) => setNewJob({ ...newJob, stipendAmount: e.target.value })}
                          className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
                          required
                        />
                      </div>
                    )}

                    {getRequiredFields(newJob.jobType).ppo && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1.5">PPO Amount (₹/year) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g., 1200000"
                          value={newJob.ppoAmount}
                          onChange={(e) => setNewJob({ ...newJob, ppoAmount: e.target.value })}
                          className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
                          required
                        />
                      </div>
                    )}

                    {getRequiredFields(newJob.jobType).ctc && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1.5">CTC Amount (₹/year) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g., 1500000"
                          value={newJob.ctcAmount}
                          onChange={(e) => setNewJob({ ...newJob, ctcAmount: e.target.value })}
                          className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1.5">Required Skills</label>
                      <input
                        type="text"
                        placeholder="e.g., Java, Python, React"
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
                        required
                      />
                    </div>

                    {/* Eligible Branches Selector */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                        Eligible Branches <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                        {BRANCHES.map((branch) => (
                          <label key={branch} className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer hover:text-zinc-900 transition-colors">
                            <input
                              type="checkbox"
                              checked={newJob.eligibleBranches?.includes(branch) || false}
                              onChange={(e) => {
                                const branches = newJob.eligibleBranches || [];
                                if (e.target.checked) {
                                  setNewJob({ ...newJob, eligibleBranches: [...branches, branch] });
                                } else {
                                  setNewJob({ ...newJob, eligibleBranches: branches.filter(b => b !== branch) });
                                }
                              }}
                              className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="truncate">{branch}</span>
                          </label>
                        ))}
                      </div>
                      {newJob.eligibleBranches?.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Please select at least one branch</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">Job Description *</label>
                    <textarea
                      placeholder="Describe the role, responsibilities, and requirements..."
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all placeholder:text-zinc-400"
                      rows="3"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Minimum 20 characters</p>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                    >
                      {editingJob ? (
                        <>
                          <Check className="w-4 h-4" />
                          Update Job
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Post Job
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h3 className="text-sm font-semibold text-zinc-900">All Jobs</h3>
              </div>
              <div className="divide-y divide-zinc-100">
                {jobs.map((job) => (
                  <div key={job.id} className={`p-5 transition-colors ${editingJob?.id === job.id ? 'bg-indigo-50/50' : 'hover:bg-zinc-50'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className={`text-sm font-semibold ${job.status === "CLOSED" ? "text-zinc-500" : "text-zinc-900"}`}>{job.title}</h4>
                        <p className="text-sm text-zinc-500">{job.company?.name}</p>
                        <p className="text-xs text-zinc-400 mt-2">
                          Min CGPA: {job.minCgpa} · Skills: {job.requiredSkills?.join(", ")}
                        </p>
                        {job.eligibleBranches && job.eligibleBranches.length > 0 && (
                          <p className="text-xs text-zinc-400 mt-1">
                            Branches: {job.eligibleBranches.join(", ")}
                          </p>
                        )}
                        {job.jobType && (
                          <p className="text-xs text-zinc-400 mt-1">
                            Type: {job.jobType.replace(/_/g, ' ')}
                            {getSalaryDisplay(job) !== 'N/A' && ` · ${getSalaryDisplay(job)}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                          job.status === "OPEN" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          {job.status}
                        </span>
                        <button
                          onClick={() => handleEditJob(job)}
                          className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit job"
                          disabled={job.status === "CLOSED"}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {job.status === "OPEN" ? (
                          <button
                            onClick={async () => {
                              const confirmed = await confirm("Close this job?", "Confirm Action", "crc");
                              if (confirmed) {
                                await closeJob({ variables: { id: job.id } });
                                refetchJobs();
                                setToast({ show: true, message: 'Job closed successfully', type: 'success' });
                                setTimeout(() => setToast({ ...toast, show: false }), 3000);
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1"
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              const confirmed = await confirm("Reopen this job?", "Confirm Action", "crc");
                              if (confirmed) {
                                await updateJob({
                                  variables: {
                                    id: job.id,
                                    input: { status: "OPEN" }
                                  }
                                });
                                refetchJobs();
                                setToast({ show: true, message: 'Job reopened successfully', type: 'success' });
                                setTimeout(() => setToast({ ...toast, show: false }), 3000);
                              }
                            }}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1"
                          >
                            Reopen
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

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl ${
            toast.type === 'success'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
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

const StudentDetailModal = ({ student, onClose }) => {
  if (!student) return null;

  const documentLinks = [
    { label: "Resume", url: student.resumeUrl, icon: "📄" },
    { label: "Report Card", url: student.reportCardUrl, icon: "📊" },
    { label: "Category Certificate", url: student.categoryCertificateUrl, icon: "📑" },
    { label: "Domicile Certificate", url: student.domicileUrl, icon: "🏠" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Student Details</h2>
            <p className="text-sm text-zinc-500">{student.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Full Name</p>
                <p className="text-sm font-medium text-zinc-900">{student.name}</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Email</p>
                <p className="text-sm font-medium text-zinc-900">{student.email}</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Personal Email</p>
                <p className="text-sm font-medium text-zinc-900">{student.personalEmail || "N/A"}</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Mobile</p>
                <p className="text-sm font-medium text-zinc-900">{student.mobile || "N/A"}</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Enrollment Number</p>
                <p className="text-sm font-medium text-zinc-900 font-mono">{student.enrollmentNumber || "N/A"}</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Branch</p>
                <p className="text-sm font-medium text-zinc-900">{student.branch || "N/A"}</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">CGPA</p>
                <p className="text-sm font-medium text-zinc-900">{student.cgpa || "N/A"}</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Category</p>
                <p className="text-sm font-medium text-zinc-900">{student.category || "N/A"}</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Gender</p>
                <p className="text-sm font-medium text-zinc-900">{student.gender || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          {student.skills && student.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill, index) => (
                  <span key={index} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documentLinks.map((doc) => (
                doc.url ? (
                  <a
                    key={doc.label}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors group"
                  >
                    <span className="text-lg">{doc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 group-hover:text-indigo-600 transition-colors">{doc.label}</p>
                      <p className="text-xs text-zinc-500 truncate">View document</p>
                    </div>
                  </a>
                ) : (
                  <div key={doc.label} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg opacity-60">
                    <span className="text-lg">{doc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-400">{doc.label}</p>
                      <p className="text-xs text-zinc-400">Not uploaded</p>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompanyApplications = ({ companyId, updateApplicationStatus }) => {
  const { data, refetch } = useQuery(GET_APPLICATIONS_BY_COMPANY, {
    variables: { companyId },
    fetchPolicy: "network-only"
  });
  const applications = data?.applicationsByCompany || [];
  const [selectedStudent, setSelectedStudent] = useState(null);

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

  const exportToExcel = () => {
    if (applications.length === 0) {
      alert("No applications to export");
      return;
    }

    const companyName = applications[0]?.company?.name || "Company";
    
    const data = applications.map((app) => ({
      "Student Name": app.student?.name || "",
      "Email": app.student?.email || "",
      "Personal Email": app.student?.personalEmail || "",
      "Mobile": app.student?.mobile || "",
      "Enrollment Number": app.student?.enrollmentNumber || "",
      "Branch": app.student?.branch || "",
      "CGPA": app.student?.cgpa || "",
      "Category": app.student?.category || "",
      "Gender": app.student?.gender || "",
      "Job Title": app.job?.title || "",
      "Resume URL": app.student?.resumeUrl || "",
      "Report Card URL": app.student?.reportCardUrl || "",
      "Category Certificate URL": app.student?.categoryCertificateUrl || "",
      "Domicile Certificate URL": app.student?.domicileUrl || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Applications");
    
    const fileName = `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_applications.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <>
      <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Applications</h3>
          {applications.length > 0 && (
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export to Excel
            </button>
          )}
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
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedStudent(app.student)}
                      className="text-sm font-medium text-zinc-900 hover:text-zinc-700 hover:underline transition-colors text-left"
                    >
                      {app.student?.name}
                    </button>
                  </td>
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

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </>
  );
};

export default CRCDashboard;
