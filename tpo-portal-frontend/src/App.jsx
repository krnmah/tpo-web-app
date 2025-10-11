import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import StudentLogin from "./pages/student/StudentLogin";
import StudentLayout from "./pages/student/StudentLayout";
import Profile from "./pages/student/Profile";
import AllCompanies from "./pages/student/AllCompanies";
import EligibleCompanies from "./pages/student/EligibleCompanies";
import Applications from "./pages/student/ApplicationTracker";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect from root ("/") to "/home" */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Homepage */}
        <Route path="/home" element={<Home />} />

        {/* Student routes */}
        <Route path="/student">
          {/* Auth routes */}
          <Route path="login" element={<StudentLogin />} />
          {/* <Route path="register" element={<StudentRegister />} /> */}

          {/* Dashboard routes */}
          <Route path="dashboard" element={<StudentLayout />}>
            <Route index element={<Profile />} />
            <Route path="profile" element={<Profile />} />
            <Route path="all-companies" element={<AllCompanies />} />
            <Route path="eligible-companies" element={<EligibleCompanies />} />
            <Route path="applications" element={<Applications />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
