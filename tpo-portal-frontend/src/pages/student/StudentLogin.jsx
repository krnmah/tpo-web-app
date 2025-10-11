import { useState } from "react";
import { useNavigate } from "react-router-dom";

const StudentLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Simple client-side validation
    const emailDomain = email.split("@")[1];
    if (!email.endsWith("@nitsri.ac.in") || emailDomain !== "nitsri.ac.in") {
      setError("Please use your official nitsri.ac.in email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // ✅ If validation passes, you can send API request here
    console.log("Email:", email, "Password:", password);

    // For demo, redirect to student dashboard
    navigate("/student/profile");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          Student Login
        </h2>

        {error && (
          <p className="text-red-500 mb-4 text-sm font-medium">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* College Email */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              College Email
            </label>
            <input
              type="email"
              placeholder="example@nitsri.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;
