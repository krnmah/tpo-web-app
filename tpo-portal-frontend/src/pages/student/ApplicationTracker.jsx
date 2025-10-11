const applications = [
  { company: "TCS", status: "Applied", date: "2025-10-05" },
  { company: "Infosys", status: "Shortlisted", date: "2025-10-08" },
];

const ApplicationTracker = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-2xl font-bold mb-4">Application Tracker</h2>
    <table className="min-w-full text-left border">
      <thead className="bg-blue-100">
        <tr>
          <th className="p-3">Company</th>
          <th className="p-3">Status</th>
          <th className="p-3">Tentative Date</th>
        </tr>
      </thead>
      <tbody>
        {applications.map((app, i) => (
          <tr key={i} className="border-t hover:bg-gray-50">
            <td className="p-3">{app.company}</td>
            <td className="p-3">{app.status}</td>
            <td className="p-3">{app.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ApplicationTracker;
