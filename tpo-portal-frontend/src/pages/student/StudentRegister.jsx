import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../utils/axios.js";

export default function StudentRegister() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.endsWith("@nitsri.ac.in")) {
      toast.error("Use your college email");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/auth/register", form, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 200) {
        toast.success(res.data.message || "Verification email sent!");
      }
    } catch (err) {
      // console.log(err.response)
      if (err.response && err.response.data) {
        toast.error(err.response.data.error || "Something went wrong!");
      } else {
        toast.error("Server not reachable!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={submit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6">Student Register</h2>
        <input
          name="name"
          value={form.name}
          onChange={change}
          required
          placeholder="Full name"
          className="w-full mb-3 p-2 border rounded"
        />
        <input
          name="email"
          value={form.email}
          onChange={change}
          required
          placeholder="email@nitsri.ac.in"
          type="email"
          className="w-full mb-3 p-2 border rounded"
        />
        <input
          name="password"
          value={form.password}
          onChange={change}
          required
          placeholder="Password"
          type="password"
          className="w-full mb-4 p-2 border rounded"
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded">
          {loading ? "Sending..." : "Register"}
        </button>
      </form>
    </div>
  );
}
