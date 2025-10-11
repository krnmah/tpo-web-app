import data from "../../assets/companies.json";

const AllCompanies = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-2xl font-bold mb-4">All Companies</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((c, i) => (
        <div key={i} className="border rounded-lg p-4 shadow hover:shadow-md">
          <h3 className="text-lg font-semibold text-blue-700">{c.name}</h3>
          <p><strong>Role:</strong> {c.role}</p>
          <p><strong>Package:</strong> {c.package}</p>
          <p><strong>Criteria:</strong> {c.criteria}</p>
          <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            View Details
          </button>
        </div>
      ))}
    </div>
  </div>
);

export default AllCompanies;
