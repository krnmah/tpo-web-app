import { useQuery } from "@apollo/client";
import { useState } from "react";
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

const STATUS_OPTIONS = ["APPLIED", "SHORTLISTED", "SELECTED", "REJECTED"];

const ApplicationTracker = () => {
  const [searchApplication, setSearchApplication] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const { data, loading, error } = useQuery(GET_MY_APPLICATIONS, {
    fetchPolicy: "network-only"
  });

  const applications = data?.myApplications || [];
  const searchQuery = searchApplication.trim().toLowerCase();
  const filteredApplications = applications.filter((app) => {
    const companyName = app.company?.name || app.job?.company?.name || "";
    const role = app.job?.title || "";
    const searchMatch = !searchQuery ||
      companyName.toLowerCase().includes(searchQuery) ||
      role.toLowerCase().includes(searchQuery);
    const statusMatch = selectedStatus === "All" || app.status === selectedStatus;

    return searchMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Applications</h1>
        <p className="text-sm text-zinc-500 mt-1">Track your job application status</p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchApplication}
            onChange={(e) => setSearchApplication(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-8 text-sm placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchApplication && (
            <button
              type="button"
              onClick={() => setSearchApplication("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              aria-label="Clear application search"
            >
              x
            </button>
          )}
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200 md:w-48"
        >
          <option value="All">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
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
      ) : filteredApplications.length === 0 && !loading && !error ? (
        <div className="bg-white border border-zinc-100 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No applications match the selected filters</h3>
          <p className="text-sm text-zinc-500">Try changing the search or status filter.</p>
        </div>
      ) : (
        /* Applications List */
        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          {/* Table Header - Desktop Only */}
          <div className="hidden md:block px-5 py-4 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900">Application History</h3>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
                {filteredApplications.map((app) => (
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

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900 px-1">Application History</h3>
            {filteredApplications.map((app) => (
              <div key={app.id} className="border border-zinc-200 rounded-xl p-4 bg-white">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-zinc-900 truncate">{app.company?.name || "N/A"}</h4>
                    <div className="flex items-center gap-1 text-zinc-600 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="text-xs truncate">{app.job?.title || "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${getStatusBadge(app.status)}`}>
                    {app.status}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {(() => {
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
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
