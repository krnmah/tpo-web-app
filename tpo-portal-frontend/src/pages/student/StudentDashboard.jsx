import { useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { GET_ELIGIBLE_JOBS, GET_MY_APPLICATIONS } from "../../graphql/queries";

const StatCard = ({ icon, label, value, color, link }) => (
  <Link to={link} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-full ${color.replace('text', 'bg').replace('600', '100')} flex items-center justify-center`}>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  </Link>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const { data: eligibleData } = useQuery(GET_ELIGIBLE_JOBS);
  const { data: applicationsData } = useQuery(GET_MY_APPLICATIONS);

  const eligibleJobs = eligibleData?.eligibleJobs || [];
  const myApplications = applicationsData?.myApplications || [];

  const stats = [
    { icon: "💼", label: "Eligible Jobs", value: eligibleJobs.length, color: "text-blue-600", link: "/student/eligible-companies" },
    { icon: "🏢", label: "All Jobs", value: "View", color: "text-green-600", link: "/student/all-jobs" },
    { icon: "📝", label: "Applications", value: myApplications.length, color: "text-purple-600", link: "/student/applications" },
    { icon: "👤", label: "Profile", value: "Edit", color: "text-orange-600", link: "/student/profile" },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-500">Student Dashboard | NIT Srinagar</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eligible Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🎯 Jobs You're Eligible For</h3>
            <Link to="/student/eligible-companies" className="text-blue-600 text-sm hover:underline">
              View All
            </Link>
          </div>
          {eligibleJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No eligible jobs found. Improve your CGPA!</p>
          ) : (
            <div className="space-y-3">
              {eligibleJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">{job.title}</h4>
                      <p className="text-sm text-gray-500">{job.company?.name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>Min CGPA: {job.minCgpa}</span>
                    <span>Applicants: {job._applicationCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📋 Recent Applications</h3>
            <Link to="/student/applications" className="text-blue-600 text-sm hover:underline">
              View All
            </Link>
          </div>
          {myApplications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">You haven't applied to any jobs yet.</p>
          ) : (
            <div className="space-y-3">
              {myApplications.slice(0, 5).map((app) => (
                <div key={app.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">{app.job?.title}</h4>
                      <p className="text-sm text-gray-500">{app.company?.name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      app.status === 'SELECTED' ? 'bg-green-100 text-green-700' :
                      app.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Applied: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="mt-6 bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-2">📌 Quick Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Your CGPA:</span>
            <span className="ml-2 font-semibold text-blue-700">{user?.cgpa || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Enrollment:</span>
            <span className="ml-2 font-semibold text-blue-700">{user?.enrollmentNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Role:</span>
            <span className="ml-2 font-semibold text-blue-700">Student</span>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-3">National Institute of Technology, Srinagar</p>
      </div>
    </div>
  );
};

export default StudentDashboard;
