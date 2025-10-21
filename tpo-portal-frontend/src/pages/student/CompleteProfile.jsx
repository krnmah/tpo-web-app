import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../utils/axios";

const departments = ["CSE", "ITE", "ECE", "EEE", " MME", "CIV", "MCH"]; // change to your list
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

export default function CompleteProfile() {
  const location = useLocation();
  const { email, name } = location.state || {};
  const [search] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const token = search.get("token");
  const [form, setForm] = useState({
    enrollment: "",
    department: "",
    batch: "",
    cgpa: "",
    twelfthPer: "",
    tenthPer: "",
    tenth: null,
    twelfth: null,
    resume: null,
    profile: null,
    sem: null,
  });
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error("Invalid access");
      navigate("/home");
    }
  }, [token, navigate]);

  function handleFile(e) {
    const { name, files } = e.target;
    if (!files || files.length === 0) return;
    setForm((prev) => ({ ...prev, [name]: files[0] }));
    if (name === "profile") setPreview(URL.createObjectURL(files[0]));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // client side validations (file types)
    const allowedPdf = (f) => f && f.type === "application/pdf";
    const allowedImage = (f) => f && f.type.startsWith("image/");
    if (
      !allowedPdf(form.tenth) ||
      !allowedPdf(form.twelfth) ||
      !allowedPdf(form.sem) ||
      !allowedPdf(form.resume)
    ) {
      toast.error("Mark sheets and resume must be PDF");
      return;
    }
    if (!allowedImage(form.profile)) {
      toast.error("Profile must be an image");
      return;
    }

    const fd = new FormData();
    fd.append("name", name);
    fd.append("email", email);
    fd.append("enrollmentNumber", form.enrollment);
    fd.append("department", form.department);
    fd.append("batch", form.batch);
    fd.append("cgpa", form.cgpa);
    fd.append("twelfthPer", form.twelfthPer);
    fd.append("tenthPer", form.tenthPer);
    fd.append("tenthMarksheet", form.tenth);
    fd.append("twelfthMarksheet", form.twelfth);
    fd.append("resume", form.resume);
    fd.append("profilePicture", form.profile);
    fd.append("semMarksheet", form.sem);

    try {
      setLoading(true);
      const res = await api.post(`/api/student/complete-profile`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          token: encodeURIComponent(token),
        },
      });
      if (res.status === 200) {
        toast.success("Profile completed! Redirecting to login...");
      }
      // redirect to student /login
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      if (err.response && err.response.data) {
        toast.error(err.response.data.error || "Something went wrong!");
      } else {
        toast.error("Server not reachable!");
      }
    } finally{
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl mt-8"
      >
        <h2 className="text-2xl font-bold mb-4">Complete Profile</h2>

        <div className="flex items-center gap-4 mb-4">
          <label className="w-28 h-28 bg-gray-100 flex items-center justify-center rounded-full overflow-hidden cursor-pointer">
            {preview ? (
              <img
                src={preview}
                alt="p"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>Upload</span>
            )}
            <input
              type="file"
              name="profile"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </label>

          <div className="flex-1">
            <input
              name="name"
              value={name}
              required
              placeholder="Enter Name"
              className="w-full mb-2 p-2 border rounded"
              disabled
            />
            <input
              name="email"
              value={email}
              required
              placeholder="Enter Name"
              className="w-full mb-2 p-2 border rounded"
              disabled
            />
            <input
              name="enrollment"
              value={form.enrollment}
              onChange={handleChange}
              required
              placeholder="Enrollment Number"
              className="w-full mb-2 p-2 border rounded"
            />
            <input
              name="cgpa"
              value={form.cgpa}
              onChange={handleChange}
              required
              placeholder="Enter latest semester cgpa"
              className="w-full mb-2 p-2 border rounded"
            />
            <input
              name="twelfthPer"
              value={form.twelfthPer}
              onChange={handleChange}
              required
              placeholder="Enter twelfth class percentage(%)"
              className="w-full mb-2 p-2 border rounded"
            />
            <input
              name="tenthPer"
              value={form.tenthPer}
              onChange={handleChange}
              required
              placeholder="Enter tenth class percentage(%)"
              className="w-full mb-2 p-2 border rounded"
            />
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              required
              className="w-full mb-2 p-2 border rounded"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              name="batch"
              value={form.batch}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Select Batch</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="file"
            name="tenth"
            accept="application/pdf"
            onChange={handleFile}
            required
          />
          <input
            type="file"
            name="twelfth"
            accept="application/pdf"
            onChange={handleFile}
            required
          />
        </div>

        <div className="mb-4">
          <input
            type="file"
            name="resume"
            accept="application/pdf"
            onChange={handleFile}
            required
          />
        </div>
        <div className="mb-4">
          <input
            type="file"
            name="sem"
            accept="application/pdf"
            onChange={handleFile}
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded w-full"
        >
          {loading ? "Creating..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
