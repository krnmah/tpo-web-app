import { useQuery, useMutation } from "@apollo/client";
import { useState } from "react";
import { Link } from "react-router-dom";
import { GET_ELIGIBLE_JOBS, APPLY_FOR_JOB, GET_MY_APPLICATIONS } from "../../graphql/queries";
import { getSalaryDisplay } from "../../utils/formatCurrency";
import { BRANCHES } from "../../constants/branches";
import JobDetailsModal from "../../components/JobDetailsModal";
import {
  Briefcase,
  ArrowRight,
} from "../../components/Icons";

const JOB_TYPE_OPTIONS = [
  { value: "INTERN_ONLY", label: "Intern Only" },
  { value: "INTERN_PPO", label: "Intern + PPO" },
  { value: "INTERN_FTE", label: "Intern + FTE" },
  { value: "FTE_ONLY", label: "FTE Only" },
];

const EligibleCompanies = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [searchJob, setSearchJob] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedJobType, setSelectedJobType] = useState("All");
  const [selectedJob, setSelectedJob] = useState(null);
  const { data, loading, refetch } = useQuery(GET_ELIGIBLE_JOBS, {
    fetchPolicy: "network-only"
  });
  const { data: applicationsData, refetch: refetchApplications } = useQuery(GET_MY_APPLICATIONS, {
    fetchPolicy: "network-only"
  });
  const [applyJob, { loading: applying }] = useMutation(APPLY_FOR_JOB);

  const myApplications = applicationsData?.myApplications || [];
  const appliedJobIds = myApplications.map(app => String(app.job?.id));

  const handleApply = async (jobId) => {
    try {
      setErrorMessage("");
      await applyJob({ variables: { jobId } });
      await Promise.all([refetch(), refetchApplications()]);
    } catch (err) {
      setErrorMessage(err.message || "Failed to apply for job");
    }
  };

  const jobs = data?.eligibleJobs || [];
  const searchQuery = searchJob.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    const searchMatch = !searchQuery ||
      job.title?.toLowerCase().includes(searchQuery) ||
      job.company?.name?.toLowerCase().includes(searchQuery);
    const branchMatch = selectedBranch === "All" ||
      !job.eligibleBranches?.length ||
      job.eligibleBranches.includes(selectedBranch);
    const jobTypeMatch = selectedJobType === "All" || job.jobType === selectedJobType;

    return searchMatch && branchMatch && jobTypeMatch;
  });
  const selectedJobApplied = selectedJob ? appliedJobIds.includes(String(selectedJob.id)) : false;

  // Branch abbreviation helper
  const abbreviateBranch = (b) => {
    if (b.includes('Computer Science')) return 'CSE';
    if (b.includes('Information Technology')) return 'IT';
    if (b.includes('Electronics')) return 'ECE';
    if (b.includes('Electrical')) return 'EE';
    if (b.includes('Mechanical')) return 'ME';
    if (b.includes('Civil')) return 'CE';
    if (b.includes('Chemical')) return 'ChE';
    if (b.includes('Metallurgical')) return 'MME';
    return b;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Eligible Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Positions you qualify for based on your CGPA & branch</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search role or company..."
            value={searchJob}
            onChange={(e) => setSearchJob(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-8 text-sm placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchJob && (
            <button
              onClick={() => setSearchJob("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              aria-label="Clear job search"
            >
              x
            </button>
          )}
        </div>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200 lg:w-72"
        >
          <option value="All">All Branches</option>
          {BRANCHES.map((branch) => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>
        <select
          value={selectedJobType}
          onChange={(e) => setSelectedJobType(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200 lg:w-44"
        >
          <option value="All">All Types</option>
          {JOB_TYPE_OPTIONS.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Empty State */}
      {jobs.length === 0 && !loading ? (
        <div className="bg-white border border-zinc-100 rounded-xl p-12 text-center">
          <Briefcase className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No eligible jobs found</h3>
          <p className="text-sm text-zinc-500 mb-6">Update your CGPA in your profile to see more opportunities</p>
          <Link
            to="/student/profile"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Go to Profile <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : filteredJobs.length === 0 && !loading ? (
        <div className="bg-white border border-zinc-100 rounded-xl p-12 text-center">
          <Briefcase className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No jobs match the selected filters</h3>
          <p className="text-sm text-zinc-500">Try changing the search, branch, or employment type filters.</p>
        </div>
      ) : (
        /* Jobs Grid - Same as AllCompanies */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredJobs.map((job) => {
            const isApplied = appliedJobIds.includes(String(job.id));

            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedJob(job);
                  }
                }}
                role="button"
                tabIndex={0}
                className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:shadow hover:border-zinc-300 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-300"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-zinc-900 truncate">{job.title}</h3>
                    <p className="text-xs text-gray-500 truncate">{job.company?.name}</p>
                  </div>
                  <span className="shrink-0 px-1.5 py-0.5 text-[10px] rounded bg-emerald-50 text-emerald-700 font-medium">
                    Eligible
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                  <p className="flex items-center gap-1"><span className="text-zinc-400">CGPA:</span> {job.minCgpa}</p>
                  {job.jobType && getSalaryDisplay(job) !== 'N/A' && (
                    <p className="flex items-center gap-1">
                      <span className="text-zinc-400">{job.jobType.replace(/_/g, ' ')}:</span>
                      <span className="text-zinc-700 font-medium">{getSalaryDisplay(job)}</span>
                    </p>
                  )}
                  {job.eligibleBranches && job.eligibleBranches.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400 shrink-0">Branches:</span>
                      <div className="flex flex-wrap gap-1">
                        {job.eligibleBranches.slice(0, 3).map((branch, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                            {abbreviateBranch(branch)}
                          </span>
                        ))}
                        {job.eligibleBranches.length > 3 && (
                          <span className="text-[10px] text-zinc-400">+{job.eligibleBranches.length - 3}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="flex items-center gap-1"><span className="text-zinc-400">Branches:</span> <span className="text-zinc-600">All Branches</span></p>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-400 shrink-0">Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {job.requiredSkills?.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px]">
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills?.length > 3 && (
                        <span className="text-[10px] text-zinc-400">+{job.requiredSkills.length - 3}</span>
                      )}
                    </div>
                  </div>
                  <p className="flex items-center gap-1"><span className="text-zinc-400">Applicants:</span> {job._applicationCount || 0}</p>
                </div>

                {job.description && (
                  <p className="text-xs text-gray-400 mb-3 line-clamp-1">{job.description}</p>
                )}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedJob(job);
                  }}
                  className="w-full py-1.5 text-sm rounded-md font-medium transition bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  {isApplied ? "View Applied Job" : "View Details"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-zinc-100 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-zinc-100 rounded w-1/2 mb-3"></div>
              <div className="space-y-1.5">
                <div className="h-3 bg-zinc-100 rounded"></div>
                <div className="h-3 bg-zinc-100 rounded"></div>
                <div className="h-3 bg-zinc-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <JobDetailsModal
        job={selectedJob}
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        onApply={handleApply}
        isApplied={selectedJobApplied}
        isEligible={true}
        applying={applying}
      />
    </div>
  );
};

export default EligibleCompanies;
