import { useState } from "react";
import toast from "react-hot-toast";

const StudentRegister = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    collegeMail: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  // OTP state
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.collegeMail.endsWith("@nitsri.ac.in")) {
      toast.error("Please use your college email (nitsri.ac.in)");
      return;
    }

    try {
      setLoading(true);
      // Call backend API to send OTP
      // await sendOTP(formData.collegeMail);
      toast.success("OTP sent to your college email!");
      setShowOTPModal(true); // show OTP modal
    } catch (err) {
      toast.error("Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      // await verifyOTP(formData.collegeMail, otp);
      toast.success("OTP verified successfully!");
      setShowOTPModal(false);
      // Redirect to profile completion page or next step
    } catch (err) {
      toast.error("Invalid OTP. Try again.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100">
      {/* Registration Form */}
      <form
        onSubmit={handleRegister}
        className={`bg-white p-8 rounded-2xl shadow-md w-full max-w-md ${
          showOTPModal ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          Student Registration
        </h2>

        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="w-full mb-4 p-2 border rounded-lg"
        />
        <input
          type="email"
          name="collegeMail"
          placeholder="College Email (@nitsri.ac.in)"
          value={formData.collegeMail}
          onChange={handleChange}
          required
          className="w-full mb-4 p-2 border rounded-lg"
        />
        <input
          type="password"
          name="password"
          placeholder="Create Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full mb-4 p-2 border rounded-lg"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Sending OTP..." : "Register"}
        </button>
      </form>

      {/* OTP Modal Overlay */}
      {showOTPModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-400 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-center text-blue-700">
              Verify OTP
            </h2>
            <p className="text-gray-600 mb-4 text-center">
              OTP sent to <strong>{formData.collegeMail}</strong>
            </p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full mb-4 p-2 border rounded-lg text-center tracking-widest"
            />
            <button
              onClick={handleVerifyOTP}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Verify OTP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegister;
