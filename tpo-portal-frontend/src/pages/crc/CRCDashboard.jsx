import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GET_COMPANIES, GET_MY_ASSIGNED_COMPANIES, CREATE_MY_COMPANY, UPDATE_COMPANY } from "../../graphql/queries";
import { GET_JOBS, CREATE_JOB, CLOSE_JOB } from "../../graphql/queries";
import { GET_APPLICATIONS_BY_COMPANY, UPDATE_APPLICATION_STATUS } from "../../graphql/queries";

const CRCDashboard = () => {
  const { user, activeRole, toggleRole, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const isStudentMode = activeRole === 'STUDENT';

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  // Queries
  const { data: companiesData, refetch: refetchCompanies } = useQuery(GET_MY_ASSIGNED_COMPANIES);
  const { data: allJobsData, refetch: refetchJobs } = useQuery(GET_JOBS, { variables: { status: "OPEN" } });

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

    // Frontend validation
    if (newCompany.description.length < 10) {
      alert('Description must be at least 10 characters long.');
      return;
    }

    try {
      const result = await createMyCompany({
        variables: {
          name: newCompany.name,
          description: newCompany.description
        }
      });

      if (result.errors && result.errors.length > 0) {
        alert(result.errors[0].message);
        return;
      }

      setNewCompany({ name: "", description: "" });
      refetchCompanies();
      alert('Company added successfully!');
    } catch (err) {
      alert(err.message || 'Failed to add company');
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();

    // Validate inputs
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

    if (!newJob.requiredSkills || newJob.requiredSkills.length === 0) {
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

      if (result.errors && result.errors.length > 0) {
        alert(result.errors[0].message);
        return;
      }

      setNewJob({ title: "", companyId: "", description: "", minCgpa: "", requiredSkills: [] });
      refetchJobs();
      alert("Job posted successfully!");
    } catch (err) {
      console.error("Error creating job:", err);
      alert(err.message || "Failed to post job");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-green-800 text-white flex flex-col">
        <div className="p-4 border-b border-green-700">
          <h2 className="text-xl font-bold">🏢 CRC Panel</h2>
          <p className="text-sm text-green-200 mt-1">NIT Srinagar</p>
        </div>

        {/* Mode Toggle Switch */}
        <div className="px-4 py-3 border-b border-green-700">
          <div className="flex items-center justify-between bg-green-900 rounded-lg p-2">
            <span className="text-xs font-medium text-green-200">
              {isStudentMode ? "🎓 Student Mode" : "🏢 CRC Mode"}
            </span>
            <button
              onClick={() => {
                toggleRole();
                navigate(isStudentMode ? "/crc/dashboard" : "/student/dashboard");
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
                isStudentMode ? "bg-blue-600" : "bg-green-600"
              }`}
            >
              <span
                className={`inline-block w-5 h-5 transform rounded-full transition-transform duration-200 ease-in-out ${
                  isStudentMode ? "translate-x-5" : "translate-x-0.5"
                } bg-white`}
              ></span>
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Show different options based on mode */}
          {isStudentMode ? (
            // Student Mode - show full student menu
            <>
              <p className="text-xs text-green-300 uppercase mb-2 px-3">Student Menu</p>
              <ul className="space-y-1">
                <li>
                  <button onClick={() => navigate("/student/dashboard")} className="w-full text-left px-3 py-2 hover:bg-green-700 rounded">
                    🎓 Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/student/all-jobs")} className="w-full text-left px-3 py-2 hover:bg-green-700 rounded">
                    🏢 All Jobs
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/student/eligible-companies")} className="w-full text-left px-3 py-2 hover:bg-green-700 rounded">
                    ✅ Eligible Jobs
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/student/applications")} className="w-full text-left px-3 py-2 hover:bg-green-700 rounded">
                    📝 Applications
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/student/profile")} className="w-full text-left px-3 py-2 hover:bg-green-700 rounded">
                    👤 Profile
                  </button>
                </li>
              </ul>
            </>
          ) : (
            // CRC Mode - show CRC management only
            <>
              <p className="text-xs text-green-300 uppercase mb-2 px-3">CRC Management</p>
              <ul className="space-y-1">
                <li>
                  <button onClick={() => setActiveTab("overview")} className={`w-full text-left px-3 py-2 rounded ${activeTab === "overview" ? "bg-green-700" : "hover:bg-green-700"}`}>
                    📊 Overview
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("companies")} className={`w-full text-left px-3 py-2 rounded ${activeTab === "companies" ? "bg-green-700" : "hover:bg-green-700"}`}>
                    🏢 My Companies
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("jobs")} className={`w-full text-left px-3 py-2 rounded ${activeTab === "jobs" ? "bg-green-700" : "hover:bg-green-700"}`}>
                    💼 Manage Jobs
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("applications")} className={`w-full text-left px-3 py-2 rounded ${activeTab === "applications" ? "bg-green-700" : "hover:bg-green-700"}`}>
                    📋 Applications
                  </button>
                </li>
              </ul>
            </>
          )}
        </nav>
        <div className="p-3 border-t border-green-700 bg-green-900">
          <p className="text-xs text-green-300">
            Logged in as <span className="font-semibold">{user?.name}</span>
          </p>
          <p className="text-xs text-green-400">CRC • {user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-green-700 text-sm text-green-200 mt-2"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <p className="text-gray-500 mb-6">National Institute of Technology, Srinagar</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Assigned Companies</p>
                <p className="text-3xl font-bold text-green-600">{companies.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Active Jobs</p>
                <p className="text-3xl font-bold text-blue-600">{jobs.filter(j => j.status === "OPEN").length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Total Applicants</p>
                <p className="text-3xl font-bold text-purple-600">{jobs.reduce((sum, j) => sum + (j._applicationCount || 0), 0)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500 text-sm">Open Positions</p>
                <p className="text-3xl font-bold text-orange-600">{jobs.filter(j => j.status === "OPEN").length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">🏢 My Assigned Companies</h3>
                {companies.length === 0 ? (
                  <p className="text-gray-500">No companies assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {companies.map((company) => (
                      <div key={company.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <h4 className="font-medium">{company.name}</h4>
                        <p className="text-sm text-gray-500">{company.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">💼 Recent Job Postings</h3>
                {jobs.length === 0 ? (
                  <p className="text-gray-500">No jobs posted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {jobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <h4 className="font-medium">{job.title}</h4>
                        <p className="text-sm text-gray-500">{job.company?.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>Min CGPA: {job.minCgpa}</span>
                          <span className={`px-2 py-1 rounded ${job.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
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
        )}

        {/* Companies Tab */}
        {activeTab === "companies" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">My Companies</h1>
            </div>

            {/* Add Company Form */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">➕ Add New Company</h3>
              <form onSubmit={handleCreateCompany} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Description (min 10 characters)"
                  value={newCompany.description}
                  onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <button type="submit" className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                  Add Company
                </button>
              </form>
            </div>

            {/* Companies List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Assigned Companies</h3>
              {companies.length === 0 ? (
                <p className="text-gray-500">No companies assigned. Add companies above.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companies.map((company) => (
                    <div key={company.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <h4 className="font-semibold text-lg">{company.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{company.description}</p>
                      <p className="text-xs text-gray-400 mt-2">Assigned to you</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Jobs</h1>

            {/* Add Job Form */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">➕ Post New Job</h3>
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Job Title (min 3 characters)"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <select
                    value={newJob.companyId}
                    onChange={(e) => setNewJob({ ...newJob, companyId: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Skills (comma separated, at least 1)"
                    value={newJob.requiredSkills.join(",")}
                    onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value.split(",").map(s => s.trim()).filter(s => s) })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <textarea
                  placeholder="Job Description"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="2"
                />
                <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700">
                  Post Job
                </button>
              </form>
            </div>

            {/* Jobs List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">All Jobs (Your Companies)</h3>
              {jobs.length === 0 ? (
                <p className="text-gray-500">No jobs posted yet.</p>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{job.title}</h4>
                          <p className="text-sm text-gray-500">{job.company?.name}</p>
                          <p className="text-xs text-gray-400 mt-1">Min CGPA: {job.minCgpa} | Skills: {job.requiredSkills?.join(", ")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${job.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {job.status}
                          </span>
                          {job.status === "OPEN" && (
                            <button
                              onClick={async () => {
                                if (confirm("Close this job?")) {
                                  await closeJob({ variables: { id: job.id } });
                                  refetchJobs();
                                }
                              }}
                              className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Applicants: {job._applicationCount || 0}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Applications Management</h1>
            <p className="text-gray-500">Select a company to view and manage applications.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {companies.map((company) => (
                <div key={company.id}
                  onClick={() => setSelectedCompany(company.id)}
                  className={`bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition ${selectedCompany === company.id ? 'ring-2 ring-green-500' : ''}`}>
                  <h3 className="font-semibold">{company.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Click to view applications</p>
                </div>
              ))}
            </div>

            {selectedCompany && (
              <CompanyApplications companyId={selectedCompany} updateApplicationStatus={updateApplicationStatus} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const CompanyApplications = ({ companyId, updateApplicationStatus }) => {
  const { data, refetch } = useQuery(GET_APPLICATIONS_BY_COMPANY, { variables: { companyId } });
  const applications = data?.applicationsByCompany || [];

  const handleStatusChange = async (applicationId, status) => {
    try {
      await updateApplicationStatus({ variables: { applicationId, status } });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Applications</h3>
      {applications.length === 0 ? (
        <p className="text-gray-500">No applications yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Student</th>
                <th className="text-left py-2 px-4">Enrollment</th>
                <th className="text-left py-2 px-4">CGPA</th>
                <th className="text-left py-2 px-4">Skills</th>
                <th className="text-left py-2 px-4">Status</th>
                <th className="text-left py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{app.student?.name}</td>
                  <td className="py-3 px-4">{app.student?.enrollmentNumber}</td>
                  <td className="py-3 px-4">{app.student?.cgpa}</td>
                  <td className="py-3 px-4">{app.student?.skills?.join(", ")}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      app.status === 'SELECTED' ? 'bg-green-100 text-green-700' :
                      app.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="APPLIED">Applied</option>
                      <option value="SHORTLISTED">Shortlist</option>
                      <option value="SELECTED">Select</option>
                      <option value="REJECTED">Reject</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CRCDashboard;
