import { useQuery, useMutation } from "@apollo/client";
import { Link } from "react-router-dom";
import { GET_ELIGIBLE_JOBS, APPLY_FOR_JOB, GET_MY_APPLICATIONS } from "../../graphql/queries";
import {
  Briefcase,
  Building2,
  TrendingUp,
  Users,
  Tag,
  Check,
  ArrowRight,
} from "../../components/Icons";

const EligibleCompanies = () => {
  const { data, loading, refetch } = useQuery(GET_ELIGIBLE_JOBS, {
    fetchPolicy: "network-only"
  });
  const { data: applicationsData, refetch: refetchApplications } = useQuery(GET_MY_APPLICATIONS, {
    fetchPolicy: "network-only"
  });
  const [applyJob, { loading: applying }] = useMutation(APPLY_FOR_JOB);

  const myApplications = applicationsData?.myApplications || [];
  // Ensure consistent type comparison - convert both to strings
  const appliedJobIds = myApplications.map(app => String(app.job?.id));

  const handleApply = async (jobId) => {
    try {
      await applyJob({ variables: { jobId } });
      // Refetch both jobs and applications to update UI state
      await Promise.all([refetch(), refetchApplications()]);
    } catch (err) {
      alert(err.message);
    }
  };

  const jobs = data?.eligibleJobs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Eligible Jobs</h1>
          <p className="text-sm text-zinc-500 mt-1">Positions you qualify for based on your CGPA</p>
        </div>
      </div>

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
      ) : (
        /* Jobs Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const isApplied = appliedJobIds.includes(String(job.id));

            return (
              <div key={job.id} className="bg-white border border-zinc-100 rounded-xl p-5 hover:border-zinc-200 transition-colors">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-900 truncate">{job.title}</h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">
                        Eligible
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">{job.company?.name}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      Min CGPA
                    </span>
                    <span className="font-medium text-zinc-900">{job.minCgpa}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      Applicants
                    </span>
                    <span className="font-medium text-zinc-900">{job._applicationCount || 0}</span>
                  </div>
                  {job.requiredSkills?.length > 0 && (
                    <div>
                      <span className="text-xs text-zinc-500 flex items-center gap-1.5 mb-2">
                        <Tag className="w-4 h-4" />
                        Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.requiredSkills.slice(0, 4).map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-zinc-50 text-zinc-600 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills.length > 4 && (
                          <span className="px-2 py-1 text-zinc-400 text-xs">
                            +{job.requiredSkills.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {job.description && (
                  <p className="text-sm text-zinc-500 mb-5 line-clamp-2">{job.description}</p>
                )}

                {/* Apply Button */}
                <button
                  onClick={() => handleApply(job.id)}
                  disabled={isApplied || applying}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isApplied
                      ? "bg-emerald-50 text-emerald-700 cursor-default"
                      : "bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50"
                  }`}
                >
                  {isApplied ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Applied
                    </span>
                  ) : (
                    "Apply Now"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-zinc-100 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-zinc-100 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-zinc-100 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-zinc-100 rounded"></div>
                <div className="h-4 bg-zinc-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EligibleCompanies;
