import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { REGISTER_STUDENT, SEND_PASSWORD_RESET_OTP, VERIFY_OTP_AND_RESET_PASSWORD, SEND_EMAIL_VERIFICATION_OTP, VERIFY_EMAIL_OTP } from "../graphql/queries";
import { useMutation } from "@apollo/client";
import nitsLogo from "../assets/nitslogo.png";
import ParticleBackground from "../components/ParticleBackground";

const DOMAIN = "@nitsri.ac.in";

// Icons
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <circle cx="12" cy="16" r="1" fill="currentColor" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Password validation
const validateStrongPassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("1 uppercase letter");
  if (!/[0-9]/.test(password)) errors.push("1 number");
  if (!/[^a-zA-Z0-9]/.test(password)) errors.push("1 special character");
  return errors;
};

// Validation schema using functional approach
const createValidators = () => ({
  emailPrefix: (value) => {
    if (!value || value.trim().length === 0) return "Email prefix is required";
    if (value.length < 3) return "Email prefix is too short";
    return null;
  },
  otp: (value) => {
    if (!value || value.length !== 6) return "Please enter a valid 6-digit OTP";
    return null;
  },
  name: (value) => {
    if (!value || value.trim().length < 2) return "Please enter your full name";
    return null;
  },
  enrollmentNumber: (value) => {
    const enrollmentRegex = /^\d{4}[A-Z]{4}\d{3}$/;
    if (!enrollmentRegex.test(value?.toUpperCase())) {
      return "Invalid format. Use: 2022BCSE024";
    }
    return null;
  },
  branch: (value) => {
    if (!value) return "Please select your branch";
    return null;
  },
  cgpa: (value) => {
    const cgpa = parseFloat(value);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) return "CGPA must be between 0 and 10";
    return null;
  },
  password: (value) => {
    const errors = validateStrongPassword(value);
    return errors.length > 0 ? `Password needs: ${errors.join(", ")}` : null;
  },
  confirmPassword: (value, allValues) => {
    if (value !== allValues.password) return "Passwords do not match";
    return null;
  },
  resumeUrl: (value) => {
    if (!value) return "Resume URL is required";
    return null;
  },
  reportCardUrl: (value) => {
    if (!value) return "Report card URL is required";
    return null;
  }
});

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'login';
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Password reset state (inline within login)
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmailPrefix, setResetEmailPrefix] = useState("");
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetResendCountdown, setResetResendCountdown] = useState(0);

  // Multi-step signup state
  const [signupStep, setSignupStep] = useState(1); // 1: Email, 2: Details
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [signupOtp, setSignupOtp] = useState("");
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

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

  const [registerStudent] = useMutation(REGISTER_STUDENT);
  const [sendPasswordResetOTP] = useMutation(SEND_PASSWORD_RESET_OTP);
  const [verifyOTPAndResetPassword] = useMutation(VERIFY_OTP_AND_RESET_PASSWORD);
  const [sendEmailVerificationOTP] = useMutation(SEND_EMAIL_VERIFICATION_OTP);
  const [verifyEmailOTP] = useMutation(VERIFY_EMAIL_OTP);

  // Countdown timer for resend OTP (both signup and reset)
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (resetResendCountdown > 0) {
      const timer = setTimeout(() => setResetResendCountdown(resetResendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown, resetResendCountdown]);

  // Reset signup step when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    if (tab === "signup") {
      setSignupStep(1);
      setVerifiedEmail("");
      setSignupOtp("");
      setSignupOtpSent(false);
      setResendCountdown(0);
      setSignupData({
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
    }
  };

  // Send OTP for email verification
  const handleSendSignupOTP = async () => {
    const validate = createValidators();
    const emailError = validate.emailPrefix(signupData.emailPrefix);

    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fullEmail = getFullEmail(signupData.emailPrefix.trim());
      const result = await sendEmailVerificationOTP({ variables: { email: fullEmail } });

      if (result.errors) {
        setError(result.errors[0].message);
      } else {
        setSignupOtpSent(true);
        setResendCountdown(60);
        setError("");
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    }
    setLoading(false);
  };

  // Verify email OTP
  const handleVerifySignupOTP = async () => {
    const validate = createValidators();
    const otpError = validate.otp(signupOtp);

    if (otpError) {
      setError(otpError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fullEmail = getFullEmail(signupData.emailPrefix.trim());
      const result = await verifyEmailOTP({ variables: { email: fullEmail, otp: signupOtp } });

      if (result.errors) {
        setError(result.errors[0].message);
      } else {
        setVerifiedEmail(fullEmail);
        setSignupStep(2);
        setError("");
      }
    } catch (err) {
      setError(err.message || "OTP verification failed. Please try again.");
    }
    setLoading(false);
  };

  // Reset signup flow
  const handleResetSignupFlow = () => {
    setSignupStep(1);
    setVerifiedEmail("");
    setSignupOtp("");
    setSignupOtpSent(false);
    setSignupData(prev => ({ ...prev, emailPrefix: "" }));
    setError("");
  };

  const getFullEmail = (prefix) => `${prefix}${DOMAIN}`;

  // Password reset handlers (inline in login form)
  const handleStartPasswordReset = () => {
    setShowPasswordReset(true);
    setError("");
  };

  const handleCancelPasswordReset = () => {
    setShowPasswordReset(false);
    setResetEmailPrefix("");
    setResetOtpSent(false);
    setResetOtp("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetResendCountdown(0);
    setError("");
  };

  const handleSendResetOTP = async () => {
    if (!resetEmailPrefix || resetEmailPrefix.trim().length === 0) {
      setError("Please enter your email prefix.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fullEmail = getFullEmail(resetEmailPrefix.trim());
      const result = await sendPasswordResetOTP({ variables: { email: fullEmail } });

      if (result.errors) {
        setError(result.errors[0].message);
      } else {
        setResetOtpSent(true);
        setResetResendCountdown(60);
        setError("");
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleVerifyResetOTP = async () => {
    if (resetOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    const validate = createValidators();
    const passwordError = validate.password(resetNewPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fullEmail = getFullEmail(resetEmailPrefix.trim());
      const result = await verifyOTPAndResetPassword({
        variables: {
          email: fullEmail,
          otp: resetOtp,
          newPassword: resetNewPassword
        }
      });

      if (result.errors) {
        setError(result.errors[0].message);
        setLoading(false);
      } else {
        // Password reset successful - show success and go back to login
        setError("");
        setLoading(false);
        handleCancelPasswordReset();
        // Show success alert
        alert("Password reset successful! Please login with your new password.");
      }
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!loginEmail || loginEmail.trim().length === 0) {
      setError("Please enter your email prefix.");
      setLoading(false);
      return;
    }

    if (loginPassword.length < 8) {
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

  const handleSignup = async (e) => {
    e.preventDefault();
    console.log("handleSignup called", { signupData, verifiedEmail });
    setError("");
    setLoading(true);

    // Validate all fields using the validators
    const validate = createValidators();
    const validations = [
      validate.name(signupData.name),
      validate.enrollmentNumber(signupData.enrollmentNumber),
      validate.branch(signupData.branch),
      validate.cgpa(signupData.cgpa),
      validate.password(signupData.password),
      validate.confirmPassword(signupData.confirmPassword, signupData),
      validate.resumeUrl(signupData.resumeUrl),
      validate.reportCardUrl(signupData.reportCardUrl)
    ];

    const firstError = validations.find(err => err !== null);
    if (firstError) {
      setError(firstError);
      setLoading(false);
      return;
    }

    try {
      const result = await registerStudent({
        variables: {
          name: signupData.name.trim(),
          enrollmentNumber: signupData.enrollmentNumber.toUpperCase(),
          email: verifiedEmail,
          password: signupData.password,
          branch: signupData.branch,
          cgpa: parseFloat(signupData.cgpa),
          skills: [],
          resumeUrl: signupData.resumeUrl.trim(),
          reportCardUrl: signupData.reportCardUrl.trim()
        }
      });

      // Check for GraphQL errors first
      if (result.errors) {
        const errorMessage = result.errors[0]?.message || "Registration failed";
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (result.data?.registerStudent) {
        const loginResult = await login(verifiedEmail, signupData.password);
        if (loginResult.success) {
          navigate("/student/dashboard");
        } else {
          setError(loginResult.error || "Login failed after registration");
        }
      } else {
        setError("Registration failed. No data returned.");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Back to Home Link */}
      <Link
        to="/home"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors duration-200"
        aria-label="Back to home"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span className="text-sm font-medium hidden sm:inline">Back</span>
      </Link>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/home" className="inline-block">
              <img
                src={nitsLogo}
                alt="NIT Srinagar"
                className="h-16 w-auto mx-auto mb-4"
              />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
              Training & Placement Department
            </h1>
            <p className="text-slate-600 text-sm">National Institute of Technology, Srinagar</p>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200/60 bg-slate-50/50">
              <button
                onClick={() => handleTabChange("login")}
                className={`flex-1 py-3.5 px-4 text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                  activeTab === "login"
                    ? "text-slate-900 bg-white"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                }`}
              >
                Login
                {activeTab === "login" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"></span>
                )}
              </button>
              <button
                onClick={() => handleTabChange("signup")}
                className={`flex-1 py-3.5 px-4 text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                  activeTab === "signup"
                    ? "text-slate-900 bg-white"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                }`}
              >
                Sign Up
                {activeTab === "signup" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"></span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {/* Error Alert */}
              {error && (
                <div className="mb-6 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-600 flex-shrink-0 mt-0.5">
                    <AlertCircleIcon />
                  </span>
                  <p className="text-sm text-red-700 flex-1">{error}</p>
                  <button
                    onClick={() => setError("")}
                    className="text-red-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <CloseIcon />
                  </button>
                </div>
              )}

              {/* Login Form */}
              {activeTab === "login" && !showPasswordReset && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-slate-900 mb-2">
                      College Email
                    </label>
                    <div className="flex">
                      <input
                        id="login-email"
                        type="text"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-sm placeholder:text-slate-400"
                        required
                      />
                      <span className="px-4 py-3 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-slate-500 text-sm font-medium">
                        {DOMAIN}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-900 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-sm placeholder:text-slate-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1 rounded hover:bg-slate-100"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleStartPasswordReset}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors duration-200"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800 mt-2"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner />
                        Logging in...
                      </span>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>
              )}

              {/* Password Reset Form (replaces login form) */}
              {activeTab === "login" && showPasswordReset && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={handleCancelPasswordReset}
                      className="text-slate-500 hover:text-slate-700 transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <h3 className="text-lg font-semibold text-slate-900">Reset Password</h3>
                  </div>

                  {!resetOtpSent ? (
                    <>
                      <p className="text-sm text-slate-600">
                        Enter your college email to receive a password reset OTP.
                      </p>
                      <div>
                        <label htmlFor="reset-email" className="block text-sm font-medium text-slate-900 mb-1.5">
                          College Email
                        </label>
                        <div className="flex">
                          <input
                            id="reset-email"
                            type="text"
                            placeholder="siddharth_2022bcse024"
                            value={resetEmailPrefix}
                            onChange={(e) => setResetEmailPrefix(e.target.value)}
                            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors duration-200 text-sm placeholder:text-slate-400"
                            required
                          />
                          <span className="px-3 py-2.5 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-600 text-sm font-medium">
                            {DOMAIN}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleSendResetOTP}
                        disabled={loading}
                        className="w-full px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Spinner />
                            Sending OTP...
                          </span>
                        ) : (
                          "Send OTP"
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="text-sm text-emerald-800">
                          OTP sent to <strong>{getFullEmail(resetEmailPrefix)}</strong>
                        </p>
                      </div>

                      <div>
                        <label htmlFor="reset-otp" className="block text-sm font-medium text-slate-900 mb-1.5">
                          Enter OTP
                        </label>
                        <input
                          id="reset-otp"
                          type="text"
                          placeholder="123456"
                          value={resetOtp}
                          onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors duration-200 text-center text-xl tracking-widest text-sm placeholder:text-slate-400"
                          maxLength={6}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="reset-new-password" className="block text-sm font-medium text-slate-900 mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            id="reset-new-password"
                            type={showNewPassword ? "text" : "password"}
                            value={resetNewPassword}
                            onChange={(e) => setResetNewPassword(e.target.value)}
                            placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors duration-200 text-sm placeholder:text-slate-400"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1 rounded hover:bg-slate-100"
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-slate-900 mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            id="reset-confirm-password"
                            type={showNewPassword ? "text" : "password"}
                            value={resetConfirmPassword}
                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors duration-200 text-sm placeholder:text-slate-400"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1 rounded hover:bg-slate-100"
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleVerifyResetOTP}
                        disabled={loading}
                        className="w-full px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Spinner />
                            Resetting...
                          </span>
                        ) : (
                          "Reset Password"
                        )}
                      </button>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Didn't receive OTP?</span>
                        {resetResendCountdown > 0 ? (
                          <span className="text-slate-500">Resend in {resetResendCountdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendResetOTP}
                            disabled={loading}
                            className="text-slate-900 hover:underline font-medium"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* Signup Form */}
              {activeTab === "signup" && (
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-4 pb-2 scroll-smooth">
                  {/* Step Progress Indicator */}
                  <div className="flex items-center gap-2 px-2">
                    <div className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${signupStep >= 1 ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                    <div className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${signupStep >= 2 ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                    <span className="text-xs font-medium text-slate-600 ml-2">
                      {signupStep === 1 ? 'Email Verification' : 'Your Details'}
                    </span>
                  </div>

                  {/* Step 1: Email Verification */}
                  {signupStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="signup-email" className="block text-sm font-medium text-slate-900 mb-1.5">
                          College Email
                        </label>
                        <div className="flex">
                          <input
                            id="signup-email"
                            type="text"
                            placeholder="siddharth_2022bcse024"
                            value={signupData.emailPrefix}
                            onChange={(e) => setSignupData({ ...signupData, emailPrefix: e.target.value })}
                            disabled={signupOtpSent}
                            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-sm placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                            required
                          />
                          <span className="px-3 py-2.5 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-600 text-sm font-medium">
                            {DOMAIN}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Enter your college email prefix</p>
                      </div>

                      {!signupOtpSent ? (
                        <button
                          type="button"
                          onClick={handleSendSignupOTP}
                          disabled={loading}
                          className="w-full px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <Spinner />
                              Sending OTP...
                            </span>
                          ) : (
                            "Send Verification OTP"
                          )}
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <p className="text-sm text-emerald-800">
                              OTP sent to <strong>{getFullEmail(signupData.emailPrefix)}</strong>
                            </p>
                          </div>

                          <div>
                            <label htmlFor="signup-otp" className="block text-sm font-medium text-slate-900 mb-1.5">
                              Enter OTP
                            </label>
                            <input
                              id="signup-otp"
                              type="text"
                              placeholder="123456"
                              value={signupOtp}
                              onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-center text-xl tracking-widest text-sm placeholder:text-slate-400"
                              maxLength={6}
                              required
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleVerifySignupOTP}
                            disabled={loading}
                            className="w-full px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800"
                          >
                            {loading ? (
                              <span className="flex items-center justify-center gap-2">
                                <Spinner />
                                Verifying...
                              </span>
                            ) : (
                              "Verify & Continue"
                            )}
                          </button>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Didn't receive OTP?</span>
                            {resendCountdown > 0 ? (
                              <span className="text-slate-500">Resend in {resendCountdown}s</span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSendSignupOTP}
                                disabled={loading}
                                className="text-slate-900 hover:underline font-medium"
                              >
                                Resend OTP
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={handleResetSignupFlow}
                            className="w-full text-sm text-slate-600 hover:text-slate-900 transition-colors duration-200"
                          >
                            Change email
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Personal Details */}
                  {signupStep === 2 && (
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          <span className="text-sm text-slate-700">
                            Email verified: <strong>{verifiedEmail}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetSignupFlow}
                          className="text-xs text-slate-500 hover:text-slate-700 transition-colors duration-200"
                        >
                          Change
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="signup-name" className="block text-sm font-medium text-slate-900 mb-1.5">
                            Full Name
                          </label>
                          <input
                            id="signup-name"
                            type="text"
                            placeholder="Siddharth Varshney"
                            value={signupData.name}
                            onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-sm placeholder:text-slate-400"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="signup-enrollment" className="block text-sm font-medium text-slate-900 mb-1.5">
                            Enrollment Number
                          </label>
                          <input
                            id="signup-enrollment"
                            type="text"
                            placeholder="2022BCSE024"
                            value={signupData.enrollmentNumber}
                            onChange={(e) => setSignupData({ ...signupData, enrollmentNumber: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-sm placeholder:text-slate-400"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="signup-branch" className="block text-sm font-medium text-slate-900 mb-1.5">
                          Branch / Department
                        </label>
                        <select
                          id="signup-branch"
                          value={signupData.branch}
                          onChange={(e) => setSignupData({ ...signupData, branch: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-sm bg-white placeholder:text-slate-400"
                          required
                        >
                          <option value="" disabled selected>Select your branch</option>
                          {branches.map((branch) => (
                            <option key={branch} value={branch}>
                              {branch}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="signup-cgpa" className="block text-sm font-medium text-slate-900 mb-1.5">
                          CGPA (out of 10)
                        </label>
                        <input
                          id="signup-cgpa"
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          placeholder="Enter your CGPA"
                          value={signupData.cgpa}
                          onChange={(e) => setSignupData({ ...signupData, cgpa: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-sm placeholder:text-slate-400"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="signup-password" className="block text-sm font-medium text-slate-900 mb-1.5">
                          Create Password
                        </label>
                        <div className="relative">
                          <input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                            value={signupData.password}
                            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-sm placeholder:text-slate-400"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1 rounded hover:bg-slate-100"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="signup-confirm" className="block text-sm font-medium text-slate-900 mb-1.5">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            id="signup-confirm"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Re-enter your password"
                            value={signupData.confirmPassword}
                            onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-sm placeholder:text-slate-400"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1 rounded hover:bg-slate-100"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="signup-resume" className="block text-sm font-medium text-slate-900 mb-1.5">
                          Resume Link (Google Drive)
                        </label>
                        <input
                          id="signup-resume"
                          type="url"
                          placeholder="Paste your resume Google Drive link here"
                          value={signupData.resumeUrl}
                          onChange={(e) => setSignupData({ ...signupData, resumeUrl: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-sm placeholder:text-slate-400"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="signup-report" className="block text-sm font-medium text-slate-900 mb-1.5">
                          Report Card Link (Google Drive)
                        </label>
                        <input
                          id="signup-report"
                          type="url"
                          placeholder="Paste your report card Google Drive link here"
                          value={signupData.reportCardUrl}
                          onChange={(e) => setSignupData({ ...signupData, reportCardUrl: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-sm placeholder:text-slate-400"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        // eslint-disable-next-line no-unused-vars
                        onClick={(e) => {
                          console.log("Button clicked");
                        }}
                        className="w-full px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800 mt-2 cursor-pointer"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Spinner />
                            Creating Account...
                          </span>
                        ) : (
                          "Create Account"
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Always at bottom */}
      <div className="py-6 text-center relative z-10">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Training & Placement Department, NIT Srinagar
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
