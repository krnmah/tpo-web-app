import { useQuery, useMutation } from "@apollo/client";
import { GET_JOBS, APPLY_FOR_JOB, GET_MY_APPLICATIONS } from "../../graphql/queries";

const AllCompanies = () => {
  const { data, loading, refetch } = useQuery(GET_JOBS, {
    variables: { status: "OPEN" },
    fetchPolicy: "network-only"
  });
  const { data: applicationsData } = useQuery(GET_MY_APPLICATIONS);
  const [applyJob] = useMutation(APPLY_FOR_JOB);

  const myApplications = applicationsData?.myApplications || [];
  const appliedJobIds = myApplications.map(app => app.job?.id);

  const handleApply = async (jobId) => {
    try {
      await applyJob({ variables: { jobId } });
      refetch();
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => {
            const isApplied = appliedJobIds.includes(job.id);
            const isEligible = job._isEligible;

            return (
              <div key={job.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.company?.name}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {job.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><strong>Min CGPA:</strong> {job.minCgpa}</p>
                  <p><strong>Required Skills:</strong></p>
                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills?.map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p><strong>Applicants:</strong> {job._applicationCount || 0}</p>
                </div>

                <div className="mb-4">
                  {isEligible ? (
                    <span className="text-green-600 text-sm">✓ You are eligible</span>
                  ) : (
                    <span className="text-red-600 text-sm">✗ Not eligible (CGPA requirement)</span>
                  )}
                </div>

                {job.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{job.description}</p>
                )}

                <button
                  onClick={() => handleApply(job.id)}
                  disabled={isApplied || !isEligible}
                  className={`w-full py-2 rounded-lg font-medium transition ${
                    isApplied
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : !isEligible
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isApplied ? "✓ Applied" : !isEligible ? "Not Eligible" : "Apply Now"}
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
