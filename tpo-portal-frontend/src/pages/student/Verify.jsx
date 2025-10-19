import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../utils/axios";
import toast from "react-hot-toast";

export default function Verify() {
  const [search] = useSearchParams();
  const token = search.get("token");
  const [status, setStatus] = useState("checking");
  const navigate = useNavigate();

  useEffect(() => {
    let executed = false;

    const verifyEmail = async () => {
      if (executed) return;
      executed = true;

      if (!token) {
        setStatus("invalid");
        return;
      }

      try {
        const res = await api.get("/api/auth/verify", { params: { token } });
        if (res.status === 200 && res.data.valid) {
          setStatus("ok");
          toast.success(res.data.message || "Email verification completed");

          setTimeout(() => {
            navigate(
              `/student/complete-profile?token=${encodeURIComponent(token)}`,
              {
                state: { email: res.data.email, name: res.data.name }
              }
            );
          }, 3000);
        } else {
          setStatus("invalid");
        }
      } catch (err) {
        if (err.response && err.response.data) {
          setStatus("invalid");
          toast.error(err.response.data.error || "Something went wrong!");
        } else {
          toast.error("Server not reachable!");
        }
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {status === "checking" && <p>Verifying your email, please wait...</p>}
        {status === "ok" && (
          <>
            <h2 className="text-xl font-bold text-green-600 mb-2">
              Email verified!
            </h2>
            <p>Redirecting to profile completion...</p>
          </>
        )}
        {status === "invalid" && (
          <>
            <h2 className="text-xl font-bold text-red-600 mb-2">
              Link is invalid or expired
            </h2>
            <p>This verification link is invalid or has expired.</p>
            <div className="mt-4">
              <button
                onClick={() => (window.location.href = "/home")}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Go to home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
