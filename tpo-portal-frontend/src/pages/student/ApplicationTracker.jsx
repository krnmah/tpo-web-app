import { useQuery } from "@apollo/client";
import { GET_MY_APPLICATIONS } from "../../graphql/queries";

const getStatusColor = (status) => {
  switch (status) {
    case "APPLIED":
      return "bg-blue-100 text-blue-800";
    case "SHORTLISTED":
      return "bg-green-100 text-green-800";
    case "SELECTED":
      return "bg-purple-100 text-purple-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ApplicationTracker = () => {
  const { data, loading, error } = useQuery(GET_MY_APPLICATIONS, {
    fetchPolicy: "network-only"
  });

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-red-500">Error loading applications: {error.message}</p>
      </div>
    );
  }

  const applications = data?.myApplications || [];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Application Tracker</h1>
      {applications.length === 0 ? (
        <p className="text-gray-500">
          You haven't applied to any jobs yet. Check out the eligible companies!
        </p>
      ) : (
        <table className="min-w-full text-left border">
          <thead className="bg-blue-100">
            <tr>
              <th className="p-3">Company</th>
              <th className="p-3">Job Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Applied Date</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{app.company?.name || "N/A"}</td>
                <td className="p-3">{app.job?.title || "N/A"}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                </td>
                <td className="p-3">{new Date(app.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ApplicationTracker;
