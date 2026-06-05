import { useQuery, useMutation } from "@apollo/client";
import { GET_JOBS, APPLY_FOR_JOB, GET_MY_APPLICATIONS } from "../../graphql/queries";
import { getSalaryDisplay } from "../../utils/formatCurrency";
import { useAuth } from "../../context/AuthContext";

const AllCompanies = () => {
  const { user, activeRole } = useAuth();
  const isCRCStudentView = user?.role === 'CRC' && activeRole === 'STUDENT';

  const { data, loading, refetch } = useQuery(GET_JOBS, {
    variables: { status: "OPEN", studentView: isCRCStudentView },
    fetchPolicy: "network-only"
  });
  const { data: applicationsData, refetch: refetchApplications } = useQuery(GET_MY_APPLICATIONS, {
    fetchPolicy: "network-only"
  });
  const [applyJob] = useMutation(APPLY_FOR_JOB);

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

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Loading jobs...</p>
      </div>
    );
  }

  const jobs = data?.jobs || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">All Companies & Jobs</h1>
      {jobs.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">No open jobs available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {jobs.map((job) => {
            const isApplied = appliedJobIds.includes(String(job.id));
            const isEligible = job._isEligible;

            return (
              <div key={job.id} className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:shadow hover:border-zinc-300 transition">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-zinc-900 truncate">{job.title}</h3>
                    <p className="text-xs text-gray-500 truncate">{job.company?.name}</p>
                  </div>
                  <span className={`shrink-0 px-1.5 py-0.5 text-[10px] rounded ${job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                    {job.status}
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
                  {job.eligibleBranches && job.eligibleBranches.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400 shrink-0">Branches:</span>
                      <div className="flex flex-wrap gap-1">
                        {job.eligibleBranches.slice(0, 3).map((branch, i) => {
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
                            <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                              {abbreviateBranch(branch)}
                            </span>
                          );
                        })}
                        {job.eligibleBranches.length > 3 && (
                          <span className="text-[10px] text-zinc-400">+{job.eligibleBranches.length - 3}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="flex items-center gap-1"><span className="text-zinc-400">Branches:</span> <span className="text-zinc-600">All Branches</span></p>
                  )}
                  <p className="flex items-center gap-1"><span className="text-zinc-400">Applicants:</span> {job._applicationCount || 0}</p>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {isEligible ? (
                    <span className="text-emerald-600 text-xs font-medium">✓ Eligible</span>
                  ) : (
                    <span className="text-red-500 text-xs font-medium">✗ Not eligible</span>
                  )}
                </div>

                {job.description && (
                  <p className="text-xs text-gray-400 mb-3 line-clamp-1">{job.description}</p>
                )}

                <button
                  onClick={() => handleApply(job.id)}
                  disabled={isApplied || !isEligible}
                  className={`w-full py-1.5 text-sm rounded-md font-medium transition ${
                    isApplied
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      : !isEligible
                      ? "bg-zinc-50 text-zinc-300 cursor-not-allowed"
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >
                  {isApplied ? "✓ Applied" : !isEligible ? "Not Eligible" : "Apply"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllCompanies;
