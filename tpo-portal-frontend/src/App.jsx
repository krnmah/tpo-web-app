import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthContext";
import { ConfirmDialogProvider } from "./components/ConfirmDialog";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Team = lazy(() => import("./pages/Team"));
const Contact = lazy(() => import("./pages/Contact"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const StudentLayout = lazy(() => import("./pages/student/StudentLayout"));
const Profile = lazy(() => import("./pages/student/Profile"));
const AllJobs = lazy(() => import("./pages/student/AllCompanies"));
const EligibleCompanies = lazy(() => import("./pages/student/EligibleCompanies"));
const Applications = lazy(() => import("./pages/student/ApplicationTracker"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const NOCSection = lazy(() => import("./pages/student/NOCSection"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const CRCDashboardHome = lazy(() => import("./pages/crc/CRCDashboardHome"));
const CRCCompaniesPage = lazy(() => import("./pages/crc/CRCCompaniesPage"));
const CRCJobsPage = lazy(() => import("./pages/crc/CRCJobsPage"));
const CRCApplicationsPage = lazy(() => import("./pages/crc/CRCApplicationsPage"));

const APP_TITLE = "T&P NITSRI";

const PAGE_TITLES = {
  "/home": "Home",
  "/about": "About",
  "/team": "Team",
  "/contact": "Contact",
  "/auth": "Login",
  "/student/dashboard": "Dashboard",
  "/student/profile": "Profile",
  "/student/all-jobs": "All Jobs",
  "/student/eligible-companies": "Eligible Jobs",
  "/student/applications": "Applications",
  "/student/noc": "NOC",
  "/crc/dashboard": "CRC Dashboard",
  "/crc/companies": "My Companies",
  "/crc/jobs": "Manage Jobs",
  "/crc/applications": "Applications",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/users": "Users",
  "/admin/companies": "Companies",
  "/admin/crc": "CRC Management",
  "/admin/stats": "Stats",
};

const getDocumentTitle = (pathname) => {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/home";
  const pageTitle = PAGE_TITLES[normalizedPath];

  return pageTitle ? `${pageTitle} - ${APP_TITLE}` : APP_TITLE;
};

function PageFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center text-sm text-slate-500">
      Loading...
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const hasToken = localStorage.getItem("token");
  const hasStoredUser = localStorage.getItem("user");

  const isActuallyAuthed = isAuthenticated || (hasToken && hasStoredUser);

  if (!isActuallyAuthed) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  let storedUser = null;
  if (!user && hasStoredUser) {
    try {
      storedUser = JSON.parse(hasStoredUser);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return <Navigate to="/auth" replace state={{ from: location }} />;
    }
  }

  const userToCheck = user || storedUser;

  if (allowedRoles && userToCheck && !allowedRoles.includes(userToCheck.role)) {
    if (userToCheck.role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (userToCheck.role === "CRC") {
      return <Navigate to="/crc/dashboard" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    document.title = getDocumentTitle(location.pathname);
  }, [location.pathname]);

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/team" element={<Team />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Student & CRC Routes (CRC can access all student features) */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["STUDENT", "CRC"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="all-jobs" element={<AllJobs />} />
          <Route path="eligible-companies" element={<EligibleCompanies />} />
          <Route path="applications" element={<Applications />} />
          <Route path="noc" element={<NOCSection />} />
        </Route>

        {/* CRC Panel (CRC-specific management features) */}
        <Route path="/crc" element={<Navigate to="/crc/dashboard" replace />} />
        <Route
          path="/crc/dashboard"
          element={
            <ProtectedRoute allowedRoles={["CRC"]}>
              <CRCDashboardHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crc/companies"
          element={
            <ProtectedRoute allowedRoles={["CRC"]}>
              <CRCCompaniesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crc/jobs"
          element={
            <ProtectedRoute allowedRoles={["CRC"]}>
              <CRCJobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crc/applications"
          element={
            <ProtectedRoute allowedRoles={["CRC"]}>
              <CRCApplicationsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
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
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <ConfirmDialogProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ConfirmDialogProvider>
    </AuthProvider>
  );
}

export default App;
