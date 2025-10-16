import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

const departments = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
];

const years = Array.from({ length: 6 }, (_, i) => 2025 - i);

const CompleteProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, name, password } = location.state || {};

  const [form, setForm] = useState({
    enrollment: "",
    department: "",
    batch: "",
    tenthMarksheet: null,
    twelfthMarksheet: null,
    resume: null,
    profilePic: null,
  });
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm({ ...form, [name]: files[0] });
      if (name === "profilePic") {
        setPreview(URL.createObjectURL(files[0]));
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Upload data using FormData
      // await completeRegistration(form, email, password);
      toast.success("Profile completed successfully!");
      navigate("/student/dashboard");
    } catch (err) {
      toast.error("Error completing profile. Try again.");
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-lg mt-10"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          Complete Your Profile
        </h2>

        <div className="flex flex-col items-center mb-6">
          <label
            htmlFor="profilePic"
            className="cursor-pointer w-32 h-32 border rounded-full overflow-hidden bg-gray-50 flex items-center justify-center"
          >
            {preview ? (
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500">Upload</span>
            )}
          </label>
          <input
            id="profilePic"
            name="profilePic"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>

        <input
          type="text"
          name="enrollment"
          placeholder="Enrollment Number"
          value={form.enrollment}
          onChange={handleChange}
          required
          className="w-full mb-4 p-2 border rounded-lg"
        />

        <select
          name="department"
          value={form.department}
          onChange={handleChange}
          required
          className="w-full mb-4 p-2 border rounded-lg"
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <select
          name="batch"
          value={form.batch}
          onChange={handleChange}
          required
          className="w-full mb-4 p-2 border rounded-lg"
        >
          <option value="">Select Batch</option>
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="file"
            name="tenthMarksheet"
            accept="application/pdf"
            onChange={handleChange}
            required
            className="p-2 border rounded-lg"
          />
          <input
            type="file"
            name="twelfthMarksheet"
            accept="application/pdf"
            onChange={handleChange}
            required
            className="p-2 border rounded-lg"
          />
        </div>

        <input
          type="file"
          name="resume"
          accept="application/pdf"
          onChange={handleChange}
          required
          className="w-full mb-4 p-2 border rounded-lg"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Complete Registration
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;
