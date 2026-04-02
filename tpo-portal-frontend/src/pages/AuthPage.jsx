import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { REGISTER_STUDENT, SEND_PASSWORD_RESET_OTP, VERIFY_OTP_AND_RESET_PASSWORD } from "../graphql/queries";
import { useMutation } from "@apollo/client";

const DOMAIN = "@nitsri.ac.in";

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

// Strong password validation
// At least 8 characters, 1 uppercase, 1 number, 1 special character
const validateStrongPassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("1 uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("1 number");
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push("1 special character");
  }

  return errors;
};

const getPasswordStrength = (password) => {
  const errors = validateStrongPassword(password);
  if (errors.length === 0) return { valid: true, message: "Strong password" };
  return { valid: false, message: `Must contain: ${errors.join(", ")}` };
};

const AuthPage = () => {
  useEffect(() => {
    console.log('🔐 AuthPage rendered - checking why we are here');
    console.log('Token exists:', !!localStorage.getItem('token'));
    console.log('User exists:', !!localStorage.getItem('user'));
  }, []);

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'login';
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Common state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupData, setSignupData] = useState({
    name: "",
    emailPrefix: "",
    password: "",
    confirmPassword: "",
    enrollmentNumber: "",
    branch: "",
    cgpa: "",
    resumeUrl: "",
    reportCardUrl: ""
  });

  // Available branches at NIT Srinagar
  const branches = [
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science and Engineering",
    "Electrical Engineering",
    "Electronics and Communication Engineering",
    "Information Technology",
    "Mechanical Engineering",
    "Metallurgical and Materials Engineering"
  ];

  // Forgot password state
  const [resetEmailPrefix, setResetEmailPrefix] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // GraphQL mutations
  const [registerStudent] = useMutation(REGISTER_STUDENT);
  const [sendOTP] = useMutation(SEND_PASSWORD_RESET_OTP);
  const [verifyOTP] = useMutation(VERIFY_OTP_AND_RESET_PASSWORD);

  const getFullEmail = (prefix) => `${prefix}${DOMAIN}`;

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!loginEmail || loginEmail.trim().length === 0) {
      setError("Please enter your email prefix.");
      setLoading(false);
      return;
    }

    if (loginPassword.length < 9) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const fullEmail = getFullEmail(loginEmail.trim());
    const result = await login(fullEmail, loginPassword);

    if (result.success) {
      const role = result.user.role;
      if (role === "STUDENT") navigate("/student/dashboard");
      else if (role === "ADMIN") navigate("/admin/dashboard");
      else if (role === "CRC") navigate("/crc/dashboard");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!signupData.name || !signupData.emailPrefix || !signupData.password || !signupData.enrollmentNumber || !signupData.branch) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Strong password validation
    const passwordCheck = getPasswordStrength(signupData.password);
    if (!passwordCheck.valid) {
      setError("Password too weak");
      setLoading(false);
      return;
    }

    if (!signupData.resumeUrl) {
      setError("Resume URL is required.");
      setLoading(false);
      return;
    }

    if (!signupData.reportCardUrl) {
      setError("Report Card URL is required.");
      setLoading(false);
      return;
    }

    const cgpa = parseFloat(signupData.cgpa);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      setError("Please enter a valid CGPA (0-10).");
      setLoading(false);
      return;
    }

    // Validate enrollment format (e.g., 2022BCSE024)
    const enrollmentRegex = /^\d{4}[A-Z]{4}\d{3}$/;
    if (!enrollmentRegex.test(signupData.enrollmentNumber.toUpperCase())) {
      setError("Invalid enrollment format. Use format: 2022BCSE024");
      setLoading(false);
      return;
    }

    const fullEmail = getFullEmail(signupData.emailPrefix.trim());

    try {
      const result = await registerStudent({
        variables: {
          name: signupData.name,
          enrollmentNumber: signupData.enrollmentNumber.toUpperCase(),
          email: fullEmail,
          password: signupData.password,
          branch: signupData.branch,
          cgpa: cgpa,
          skills: [], // Empty array since skills are removed from signup
          resumeUrl: signupData.resumeUrl,
          reportCardUrl: signupData.reportCardUrl
        }
      });

      if (result.data?.registerStudent) {
        // Auto login after signup
        const loginResult = await login(fullEmail, signupData.password);
        if (loginResult.success) {
          navigate("/student/dashboard");
        }
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  // Handle Send OTP
  const handleSendOTP = async () => {
    if (!resetEmailPrefix || resetEmailPrefix.trim().length === 0) {
      setError("Please enter your email prefix.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await sendOTP({
        variables: { email: getFullEmail(resetEmailPrefix.trim()) }
      });

      if (result.errors) {
        setError(result.errors[0].message);
      } else {
        setOtpSent(true);
        setError("");
      }
    } catch {
      setError("Failed to send OTP. Please try again.");
    }
    setLoading(false);
  };

  // Handle Reset Password
  const handleResetPassword = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    // Strong password validation
    const errors = validateStrongPassword(newPassword);
    if (errors.length > 0) {
      setError("Password too weak");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyOTP({
        variables: {
          email: getFullEmail(resetEmailPrefix.trim()),
          otp,
          newPassword
        }
      });

      if (result.errors) {
        setError(result.errors[0].message);
      } else {
        setActiveTab("login");
        cancelOTPFlow();
        alert("Password reset successfully! Please login with your new password.");
      }
    } catch {
      setError("Failed to reset password. Please try again.");
    }
    setLoading(false);
  };

  // Cancel OTP flow - reset state
  const cancelOTPFlow = () => {
    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setResetEmailPrefix("");
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">
            🎓 Training & Placement Portal
          </h1>
          <p className="text-gray-500">National Institute of Technology, Srinagar</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "login"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "signup"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setActiveTab("forgot")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "forgot"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Forgot Password
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Login Tab */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">College Email</label>
              <div className="flex">
                <input
                  type="text"
                  placeholder="your.email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-lg text-gray-600 text-sm">
                  {DOMAIN}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {loading ? "Processing..." : "Login"}
            </button>
          </form>
        )}

        {/* Signup Tab */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={signupData.name}
                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Enrollment Number</label>
              <input
                type="text"
                placeholder="2022BCSE024"
                value={signupData.enrollmentNumber}
                onChange={(e) => setSignupData({ ...signupData, enrollmentNumber: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Format: 2022BCSE024</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Branch *</label>
              <select
                value={signupData.branch}
                onChange={(e) => setSignupData({ ...signupData, branch: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                required
              >
                <option value="">Select your branch</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">College Email</label>
              <div className="flex">
                <input
                  type="text"
                  placeholder="your.email"
                  value={signupData.emailPrefix}
                  onChange={(e) => setSignupData({ ...signupData, emailPrefix: e.target.value })}
                  className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-lg text-gray-600 text-sm">
                  {DOMAIN}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">CGPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="8.5"
                value={signupData.cgpa}
                onChange={(e) => setSignupData({ ...signupData, cgpa: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Resume URL *</label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={signupData.resumeUrl}
                onChange={(e) => setSignupData({ ...signupData, resumeUrl: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Upload your resume to Google Drive and paste the link</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Report Card URL *</label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={signupData.reportCardUrl}
                onChange={(e) => setSignupData({ ...signupData, reportCardUrl: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Upload your latest mark sheet</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
        )}

        {/* Forgot Password Tab */}
        {activeTab === "forgot" && (
          <div className="space-y-4">
            {!otpSent ? (
              <>
                <p className="text-sm text-gray-600">Enter your email to receive a password reset OTP.</p>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">College Email</label>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="your.email"
                      value={resetEmailPrefix}
                      onChange={(e) => setResetEmailPrefix(e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                    <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-lg text-gray-600 text-sm">
                      {DOMAIN}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  OTP has been sent to <strong>{getFullEmail(resetEmailPrefix)}</strong>
                </p>

                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Enter 6-digit OTP</label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <button
                  onClick={cancelOTPFlow}
                  className="w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
