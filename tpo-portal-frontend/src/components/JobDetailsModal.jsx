import { Briefcase, Building2, Calendar, Check, IndianRupee, Target, X } from "./Icons";
import { getSalaryDisplay } from "../utils/formatCurrency";

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

const JobDetailsModal = ({
  job,
  isOpen,
  onClose,
  onApply,
  isApplied,
  isEligible = true,
  applying = false,
  eligibleLabel = "Eligible",
}) => {
  if (!isOpen || !job) return null;

  const salaryDisplay = getSalaryDisplay(job);
  const canApply = !isApplied && isEligible && !applying;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-details-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
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
                {isEligible ? eligibleLabel : "Not eligible"}
              </span>
            </div>
            <h2 id="job-details-title" className="text-xl font-semibold text-zinc-950">
              {job.title}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
              <Building2 className="h-4 w-4" />
              {job.company?.name || "Company not specified"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close job details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="Minimum CGPA" value={job.minCgpa ?? "Not specified"} />
            <DetailItem label="Compensation" value={salaryDisplay !== "N/A" ? salaryDisplay : "Not specified"} />
            <DetailItem label="Applicants" value={job._applicationCount || 0} />
            <DetailItem label="Posted On" value={formatDate(job.createdAt)} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
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

            <div className="space-y-5">
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

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onApply(job.id)}
            disabled={!canApply}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              canApply
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : "cursor-not-allowed bg-zinc-100 text-zinc-400"
            }`}
          >
            {isApplied ? "Applied" : applying ? "Applying..." : isEligible ? "Apply" : "Not Eligible"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;
