import { useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import { GET_MY_APPLICATIONS } from "../../graphql/queries";
import {
  FileText,
  Building2,
  Calendar,
  ArrowRight,
  Briefcase,
} from "../../components/Icons";

const getStatusBadge = (status) => {
  const styles = {
    APPLIED: "bg-zinc-100 text-zinc-700 border-zinc-200",
    SHORTLISTED: "bg-sky-50 text-sky-700 border-sky-100",
    SELECTED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    REJECTED: "bg-red-50 text-red-700 border-red-100",
  };
  return styles[status] || styles.APPLIED;
};

const ApplicationTracker = () => {
  const { data, loading, error } = useQuery(GET_MY_APPLICATIONS, {
    fetchPolicy: "network-only"
  });

  const applications = data?.myApplications || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Applications</h1>
        <p className="text-sm text-zinc-500 mt-1">Track your job application status</p>
      </div>

      {/* Empty State */}
      {applications.length === 0 && !loading && !error ? (
        <div className="bg-white border border-zinc-100 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No applications yet</h3>
          <p className="text-sm text-zinc-500 mb-6">Start applying to jobs to track your progress</p>
          <Link
            to="/student/eligible-companies"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Browse Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Applications List */
        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900">Application History</h3>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Company</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-zinc-900">{app.company?.name || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-700">{app.job?.title || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Calendar className="w-4 h-4" />
                        {(() => {
                          // Handle both timestamp strings and ISO date strings
                          let date;
                          if (/^\d+$/.test(app.createdAt)) {
                            date = new Date(parseInt(app.createdAt));
                          } else {
                            date = new Date(app.createdAt);
                          }
                          return isNaN(date.getTime())
                            ? 'N/A'
                            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-zinc-100 rounded-xl p-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 bg-zinc-100 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-100 rounded w-1/4"></div>
                <div className="h-3 bg-zinc-100 rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-zinc-100 rounded-full w-16"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
          <p className="text-red-700">Error loading applications: {error.message}</p>
        </div>
      )}
    </div>
  );
};

export default ApplicationTracker;
