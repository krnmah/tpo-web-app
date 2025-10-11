import data from "../../assets/companies.json";

const EligibleCompanies = () => {
  const eligible = data.filter((c) => c.minCGPA <= 8.7);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Eligible Companies</h2>
      <ul className="space-y-3">
        {eligible.map((c, i) => (
          <li key={i} className="border p-3 rounded hover:bg-gray-50">
            <span className="font-semibold text-blue-700">{c.name}</span> — {c.role}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EligibleCompanies;
