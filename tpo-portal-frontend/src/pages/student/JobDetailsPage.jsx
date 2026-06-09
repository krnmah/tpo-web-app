import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { APPLY_FOR_JOB, GET_JOB, GET_MY_APPLICATIONS } from "../../graphql/queries";
import { getSalaryDisplay } from "../../utils/formatCurrency";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Check,
  IndianRupee,
  Target,
} from "../../components/Icons";

const formatJobType = (value) => value ? value.replace(/_/g, " ") : "Not specified";

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const DetailItem = ({ label, value }) => (
  <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
    <p className="mt-1 text-sm font-medium text-zinc-800">{value}</p>
  </div>
);

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState("");
  const isEligibleRoute = location.pathname.includes("/eligible-companies/");
  const backPath = isEligibleRoute ? "/student/eligible-companies" : "/student/all-jobs";
  const backLabel = isEligibleRoute ? "Eligible Jobs" : "All Jobs";

  const { data, loading, error, refetch } = useQuery(GET_JOB, {
    variables: { id: jobId },
    fetchPolicy: "network-only",
  });

  const { data: applicationsData, refetch: refetchApplications } = useQuery(GET_MY_APPLICATIONS, {
    fetchPolicy: "network-only",
  });

  const [applyJob, { loading: applying }] = useMutation(APPLY_FOR_JOB);

  const job = data?.job;
  const appliedJobIds = (applicationsData?.myApplications || []).map((app) => String(app.job?.id));
  const isApplied = job ? appliedJobIds.includes(String(job.id)) : false;
  const isEligible = job ? Boolean(job._isEligible) : false;
  const salaryDisplay = job ? getSalaryDisplay(job) : "N/A";
  const canApply = Boolean(job && job.status === "OPEN" && !isApplied && isEligible && !applying);

  const handleApply = async () => {
    if (!job) return;

    try {
      setErrorMessage("");
      await applyJob({ variables: { jobId: job.id } });
      await Promise.all([refetch(), refetchApplications()]);
    } catch (err) {
      setErrorMessage(err.message || "Failed to apply for job");
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-sm text-zinc-500">Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-6">
        <p className="text-sm text-red-700">{error?.message || "Job posting was not found."}</p>
        <Link to={backPath} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-900">
          Back to {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        to={backPath}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        Back to {backLabel}
      </Link>

      {errorMessage && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="rounded-xl border border-zinc-100 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
              <Briefcase className="h-3.5 w-3.5" />
              {formatJobType(job.jobType)}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              job.status === "OPEN" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
            }`}>
              {job.status || "OPEN"}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              isEligible ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}>
              {isEligible ? "Eligible" : "Not eligible"}
            </span>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-zinc-950">{job.title}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
                <Building2 className="h-4 w-4" />
                {job.company?.name || "Company not specified"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                canApply
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "cursor-not-allowed bg-zinc-100 text-zinc-400"
              }`}
            >
              {isApplied ? "Applied" : applying ? "Applying..." : isEligible ? "Apply" : "Not Eligible"}
              {canApply && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="Minimum CGPA" value={job.minCgpa ?? "Not specified"} />
            <DetailItem label="Compensation" value={salaryDisplay !== "N/A" ? salaryDisplay : "Not specified"} />
            <DetailItem label="Applicants" value={job._applicationCount || 0} />
            <DetailItem label="Posted On" value={formatDate(job.createdAt)} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-6">
              <section>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <Target className="h-4 w-4 text-zinc-500" />
                  Job Description
                </div>
                <p className="whitespace-pre-line rounded-lg border border-zinc-100 bg-white p-3 text-sm leading-6 text-zinc-600">
                  {job.description || "No description has been added for this job posting."}
                </p>
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <Check className="h-4 w-4 text-zinc-500" />
                  Required Skills
                </div>
                {job.requiredSkills?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill, index) => (
                      <span key={`${skill}-${index}`} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No required skills listed.</p>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <Briefcase className="h-4 w-4 text-zinc-500" />
                  Eligible Branches
                </div>
                {job.eligibleBranches?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {job.eligibleBranches.map((branch) => (
                      <span key={branch} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {branch}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">All branches are eligible.</p>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <IndianRupee className="h-4 w-4 text-zinc-500" />
                  Salary Details
                </div>
                <div className="space-y-2">
                  {job.stipendAmount != null && <DetailItem label="Stipend" value={`Rs. ${job.stipendAmount}`} />}
                  {job.ppoAmount != null && <DetailItem label="PPO" value={`Rs. ${job.ppoAmount}`} />}
                  {job.ctcAmount != null && <DetailItem label="CTC" value={`Rs. ${job.ctcAmount}`} />}
                  {job.stipendAmount == null && job.ppoAmount == null && job.ctcAmount == null && (
                    <p className="text-sm text-zinc-500">No salary breakup available.</p>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  Timeline
                </div>
                <div className="space-y-2">
                  <DetailItem label="Created" value={formatDate(job.createdAt)} />
                  <DetailItem label="Updated" value={formatDate(job.updatedAt)} />
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;
