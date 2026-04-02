import { useQuery, useMutation } from "@apollo/client";
import { GET_ELIGIBLE_JOBS, APPLY_FOR_JOB, GET_MY_APPLICATIONS } from "../../graphql/queries";

const EligibleCompanies = () => {
  const { data, loading, refetch } = useQuery(GET_ELIGIBLE_JOBS, {
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
        <p className="text-gray-500">Loading eligible jobs...</p>
      </div>
    );
  }

  const jobs = data?.eligibleJobs || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Eligible Jobs</h1>
      <p className="text-gray-600 mb-6">Jobs you can apply for based on your CGPA</p>

      {jobs.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 mb-4">
            No eligible jobs found. Update your CGPA in your profile to see more opportunities.
          </p>
          <a href="profile" className="text-blue-600 hover:underline">Go to Profile →</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => {
            const isApplied = appliedJobIds.includes(job.id);

            return (
              <div key={job.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-blue-700">{job.title}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Eligible
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{job.company?.name}</p>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Min CGPA:</span>
                    <span className="font-medium">{job.minCgpa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Applicants:</span>
                    <span className="font-medium">{job._applicationCount || 0}</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Required Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {job.requiredSkills?.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {job.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3">{job.description}</p>
                )}

                <button
                  onClick={() => handleApply(job.id)}
                  disabled={isApplied}
                  className={`w-full py-2 rounded-lg font-medium transition ${
                    isApplied
                      ? "bg-green-100 text-green-700 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isApplied ? "✓ Applied" : "Apply Now"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EligibleCompanies;
