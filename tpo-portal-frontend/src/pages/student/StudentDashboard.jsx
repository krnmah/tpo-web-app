import { useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { GET_ELIGIBLE_JOBS, GET_MY_APPLICATIONS } from "../../graphql/queries";
import {
  Briefcase,
  Building,
  FileText,
  User,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
} from "../../components/Icons";

// Skeleton loaders
const StatCardSkeleton = () => (
  <div className="bg-white border border-zinc-200 rounded-2xl p-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-zinc-100"></div>
      <div className="flex-1">
        <div className="h-4 bg-zinc-100 rounded w-16 mb-1.5"></div>
        <div className="h-5 bg-zinc-100 rounded w-8"></div>
      </div>
    </div>
  </div>
);

const JobCardSkeleton = () => (
  <div className="border border-zinc-100 rounded-xl p-4 space-y-3 animate-pulse">
    <div className="h-5 bg-zinc-100 rounded w-3/4"></div>
    <div className="h-4 bg-zinc-100 rounded w-1/2"></div>
    <div className="flex gap-4">
      <div className="h-4 bg-zinc-100 rounded w-16"></div>
      <div className="h-4 bg-zinc-100 rounded w-16"></div>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, link }) => (
  <Link
    to={link}
    className="group relative bg-white border border-zinc-200 rounded-2xl p-4 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/50 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
  >
    {/* Subtle gradient overlay on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

    <div className="relative flex items-center gap-3">
      {/* Icon container with animated background */}
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 group-hover:from-zinc-200 group-hover:to-zinc-100 flex items-center justify-center text-zinc-600 group-hover:text-zinc-800 group-hover:scale-110 transition-all duration-200">
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide group-hover:text-zinc-600 transition-colors">{label}</p>
        <p className="text-lg font-semibold text-zinc-900 mt-0.5 group-hover:text-zinc-950 transition-colors">{value}</p>
      </div>

      {/* Arrow indicator on hover */}
      <ArrowRight className="w-4 h-4 text-zinc-400 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200" />
    </div>
  </Link>
);

const EmptyState = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 mb-3">
      <FileText className="w-5 h-5" />
    </div>
    <p className="text-sm font-medium text-zinc-700">{title}</p>
    <p className="text-sm text-zinc-500 mt-1">{description}</p>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const { data: eligibleData, loading: eligibleLoading } = useQuery(GET_ELIGIBLE_JOBS, {
    fetchPolicy: "network-only"
  });
  const { data: applicationsData, loading: applicationsLoading } = useQuery(GET_MY_APPLICATIONS, {
    fetchPolicy: "network-only"
  });

  const eligibleJobs = eligibleData?.eligibleJobs || [];
  const myApplications = applicationsData?.myApplications || [];
  const isLoading = eligibleLoading || applicationsLoading;

  const stats = [
    { icon: Briefcase, label: "Eligible Jobs", value: eligibleLoading ? "—" : eligibleJobs.length, link: "/student/eligible-companies" },
    { icon: Building, label: "All Jobs", value: "View", link: "/student/all-jobs" },
    { icon: FileText, label: "Applications", value: applicationsLoading ? "—" : myApplications.length, link: "/student/applications" },
    { icon: User, label: "Profile", value: "Edit", link: "/student/profile" },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      OPEN: "bg-emerald-50 text-emerald-700 border-emerald-100",
      CLOSED: "bg-zinc-50 text-zinc-600 border-zinc-200",
      SELECTED: "bg-emerald-50 text-emerald-700 border-emerald-100",
      SHORTLISTED: "bg-sky-50 text-sky-700 border-sky-100",
      REJECTED: "bg-red-50 text-red-700 border-red-100",
      PENDING: "bg-amber-50 text-amber-700 border-amber-100",
      APPLIED: "bg-zinc-50 text-zinc-600 border-zinc-200",
    };
    const defaultStyle = "bg-zinc-50 text-zinc-600 border-zinc-200";
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${styles[status] || defaultStyle}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Welcome back, {user?.name?.split(' ')[0] || 'Student'}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => <StatCardSkeleton key={idx} />)
        ) : (
          stats.map((stat, idx) => <StatCard key={idx} {...stat} />)
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Eligible Jobs */}
        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Eligible Jobs</h3>
            <Link to="/student/eligible-companies" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-5">
            {eligibleLoading ? (
              <div className="space-y-3">
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            ) : eligibleJobs.length === 0 ? (
              <EmptyState title="No eligible jobs" description="Improve your CGPA to see more opportunities" />
            ) : (
              <div className="space-y-2">
                {eligibleJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="border border-zinc-100 rounded-lg p-4 hover:bg-zinc-50 hover:border-zinc-200 transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-zinc-900 truncate">{job.title}</h4>
                        <p className="text-sm text-zinc-500 truncate">{job.company?.name}</p>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Min CGPA: {job.minCgpa}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {job._applicationCount || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Applications</h3>
            <Link to="/student/applications" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-5">
            {applicationsLoading ? (
              <div className="space-y-3">
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            ) : myApplications.length === 0 ? (
              <EmptyState title="No applications yet" description="Start applying to track your progress" />
            ) : (
              <div className="space-y-2">
                {myApplications.slice(0, 5).map((app) => (
                  <div key={app.id} className="border border-zinc-100 rounded-lg p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-zinc-900 truncate">{app.job?.title || 'Unknown Position'}</h4>
                        <p className="text-sm text-zinc-500 truncate">{app.company?.name || 'Unknown Company'}</p>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Applied {app.createdAt
                          ? (() => {
                              try {
                                // Handle both timestamp strings and ISO date strings
                                let date;
                                if (/^\d+$/.test(app.createdAt)) {
                                  // It's a timestamp string/number
                                  date = new Date(parseInt(app.createdAt));
                                } else {
                                  date = new Date(app.createdAt);
                                }
                                if (!isNaN(date.getTime())) {
                                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                }
                              } catch (e) {
                                console.log('Invalid date:', app.createdAt);
                              }
                              return 'Recently';
                            })()
                          : 'Recently'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Summary - AT THE BOTTOM */}
      <div className="mt-auto bg-white border border-zinc-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Profile Summary</h3>
          </div>
          <Link
            to="/student/profile"
            className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
          >
            Edit profile <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 text-sm">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Name</p>
              <p className="font-semibold text-zinc-900">{user?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Email</p>
              <p className="font-medium text-zinc-700 truncate">{user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">CGPA</p>
              <p className="font-semibold text-zinc-900">{user?.cgpa || 'N/A'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Enrollment</p>
              <p className="font-semibold text-zinc-900">{user?.enrollmentNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Branch</p>
              <p className="font-semibold text-zinc-900">{user?.branch || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
