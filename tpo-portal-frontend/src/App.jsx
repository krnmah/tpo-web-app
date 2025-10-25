import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Login from "./pages/Login";
import StudentLayout from "./pages/student/StudentLayout";
import Profile from "./pages/student/Profile";
import AllCompanies from "./pages/student/AllCompanies";
import EligibleCompanies from "./pages/student/EligibleCompanies";
import Applications from "./pages/student/ApplicationTracker";
import StudentRegister from "./pages/student/StudentRegister";
import Verify from "./pages/student/Verify";
import CompleteProfile from "./pages/student/CompleteProfile";
import ProtectedRoute from "./components/ProtectedRoute";

// Optional: Admin and CRC dashboards (you’ll add these later)
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import CRCDashboard from "./pages/crc/CRCDashboard";

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          {/* Root → redirect to /home */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Homepage */}
          <Route path="/home" element={<Home />} />

          {/* Universal login for all roles */}
          <Route path="/login" element={<Login />} />

          {/* Student registration flow */}
          <Route path="/student/register" element={<StudentRegister />} />
          <Route path="/student/verify" element={<Verify />} />
          <Route path="/student/complete-profile" element={<CompleteProfile />} />

          {/* Student dashboard layout */}
          <Route 
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AllCompanies />} />
            <Route path="profile" element={<Profile />} />
            <Route path="all-companies" element={<AllCompanies />} />
            <Route path="eligible-companies" element={<EligibleCompanies />} />
            <Route path="applications" element={<Applications />} />
          </Route>

          {/* CRC Dashboard */}
          {/* <Route path="/crc/dashboard" element={<CRCDashboard />} /> */}

          {/* Admin Dashboard */}
          {/* <Route path="/admin/dashboard" element={<AdminDashboard />} /> */}

          {/* Catch-all redirect (optional) */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
