import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthContext";
import { ConfirmDialogProvider } from "./components/ConfirmDialog";
import Home from "./pages/Home";
import About from "./pages/About";
import Team from "./pages/Team";
import Contact from "./pages/Contact";
import AuthPage from "./pages/AuthPage";
import StudentLayout from "./pages/student/StudentLayout";
import Profile from "./pages/student/Profile";
import AllJobs from "./pages/student/AllCompanies";
import EligibleCompanies from "./pages/student/EligibleCompanies";
import Applications from "./pages/student/ApplicationTracker";
import StudentDashboard from "./pages/student/StudentDashboard";
import CRCDashboard from "./pages/crc/CRCDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { useEffect } from "react";

// Log route changes
function RouteLogger() {
  const location = useLocation();
  useEffect(() => {
    console.log('📍 Route changed to:', location.pathname);
  }, [location]);
  return null;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  // Check localStorage directly as the primary auth check
  const hasToken = localStorage.getItem('token');
  const hasStoredUser = localStorage.getItem('user');

  console.log('🔒 ProtectedRoute check:', {
    isAuthenticated,
    hasToken: !!hasToken,
    hasStoredUser: !!hasStoredUser,
    userRole: user?.role,
    path: window.location.pathname
  });

  const isActuallyAuthed = isAuthenticated || (hasToken && hasStoredUser);

  if (!isActuallyAuthed) {
    console.log('❌ Not authenticated, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // Parse stored user if context user is not available yet
  const userToCheck = user || (hasStoredUser ? JSON.parse(hasStoredUser) : null);

  // Check if user's role is in the allowed roles array
  if (allowedRoles && userToCheck && !allowedRoles.includes(userToCheck.role)) {
    console.log('⛔ Role not allowed, redirecting. User role:', userToCheck.role, 'Allowed:', allowedRoles);
    if (userToCheck.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userToCheck.role === 'CRC') {
      return <Navigate to="/crc/dashboard" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  console.log('✅ Authenticated, rendering children');
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/team" element={<Team />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Student & CRC Routes (CRC can access all student features) */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['STUDENT', 'CRC']}>
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="all-jobs" element={<AllJobs />} />
        <Route path="eligible-companies" element={<EligibleCompanies />} />
        <Route path="applications" element={<Applications />} />
      </Route>

      {/* CRC Panel (CRC-specific management features) */}
      <Route
        path="/crc/dashboard"
        element={
          <ProtectedRoute allowedRoles={['CRC']}>
            <CRCDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminDashboard />} />
        <Route path="companies" element={<AdminDashboard />} />
        <Route path="crc" element={<AdminDashboard />} />
        <Route path="stats" element={<AdminDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ConfirmDialogProvider>
        <BrowserRouter>
          <RouteLogger />
          <AppRoutes />
        </BrowserRouter>
      </ConfirmDialogProvider>
    </AuthProvider>
  );
}

export default App;
