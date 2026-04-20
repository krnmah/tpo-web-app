import { useState } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_PROFILE, CHANGE_PASSWORD } from "../../graphql/queries";
import { useAuth } from "../../context/AuthContext";

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
const validateStrongPassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("at least 8 characters");
  }
  if (password.length > 20) {
    errors.push("no more than 20 characters");
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

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Profile edit form
  const [editForm, setEditForm] = useState({
    cgpa: user?.cgpa || "",
    resumeUrl: user?.resumeUrl || "",
    reportCardUrl: user?.reportCardUrl || ""
  });

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const [updateProfile] = useMutation(UPDATE_PROFILE);
  const [changePassword] = useMutation(CHANGE_PASSWORD);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const cgpa = parseFloat(editForm.cgpa);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      setError("Please enter a valid CGPA (0-10).");
      return;
    }

    try {
      const variables = { cgpa: cgpa };
      if (editForm.resumeUrl) variables.resumeUrl = editForm.resumeUrl;
      if (editForm.reportCardUrl) variables.reportCardUrl = editForm.reportCardUrl;

      const result = await updateProfile({
        variables
      });

      if (result.data?.updateProfile) {
        updateUser(result.data.updateProfile);
        setMessage("Profile updated successfully!");
        setIsEditing(false);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called', passwordForm);
    setError("");
    setMessage("");

    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    // Strong password validation
    const errors = validateStrongPassword(passwordForm.newPassword);
    if (errors.length > 0) {
      setError("Password too weak");
      return;
    }

    console.log('Submitting password change...');

    try {
      const result = await changePassword({
        variables: {
          newPassword: passwordForm.newPassword
        }
      });

      console.log('Password change result:', result);

      // Check for errors in the result
      if (result.errors && result.errors.length > 0) {
        const errorMessage = result.errors[0].message;
        setError(errorMessage);
        return;
      }

      if (result.data?.changePassword) {
        setMessage("Password changed successfully!");
        setPasswordForm({ newPassword: "", confirmPassword: "" });
        setIsChangingPassword(false);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error('Password change error:', err);
      // Extract GraphQL error message
      const errorMessage = err.graphQLErrors?.[0]?.message || err.message || "Failed to change password";
      setError(errorMessage);
    }
  };

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">No profile data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
            <p className="text-gray-500 text-sm">NIT Srinagar</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
            >
              Edit Profile
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Full Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Enrollment Number</p>
              <p className="font-medium font-mono">{user.enrollmentNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Branch</p>
              <p className="font-medium">{user.branch || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">CGPA</p>
              <p className="font-medium">{user.cgpa || "N/A"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 mb-2">Documents</p>
              <div className="flex flex-wrap gap-3">
                {user.resumeUrl ? (
                  <a
                    href={user.resumeUrl}
                    className="text-zinc-900 hover:underline inline-flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📄 Resume
                  </a>
                ) : (
                  <span className="text-gray-400">No resume uploaded</span>
                )}
                {user.reportCardUrl ? (
                  <a
                    href={user.reportCardUrl}
                    className="text-zinc-900 hover:underline inline-flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📊 Report Card
                  </a>
                ) : (
                  <span className="text-gray-400">No report card uploaded</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                <p className="font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-400">Name cannot be changed</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Enrollment Number</p>
                <p className="font-medium text-gray-700 font-mono">{user?.enrollmentNumber || "N/A"}</p>
                <p className="text-xs text-gray-400">Enrollment number cannot be changed</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Branch</p>
                <p className="font-medium text-gray-700">{user?.branch || "N/A"}</p>
                <p className="text-xs text-gray-400">Branch cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={editForm.cgpa}
                  onChange={(e) => setEditForm({ ...editForm, cgpa: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume URL</label>
                <input
                  type="url"
                  value={editForm.resumeUrl}
                  onChange={(e) => setEditForm({ ...editForm, resumeUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Card URL</label>
                <input
                  type="url"
                  value={editForm.reportCardUrl}
                  onChange={(e) => setEditForm({ ...editForm, reportCardUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    cgpa: user?.cgpa || "",
                    resumeUrl: user?.resumeUrl || "",
                    reportCardUrl: user?.reportCardUrl || ""
                  });
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change Password Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Change Password</h3>

        {!isChangingPassword ? (
          <button
            onClick={() => setIsChangingPassword(true)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  maxLength={20}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  maxLength={20}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
              >
                Update Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordForm({ newPassword: "", confirmPassword: "" });
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
