import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  if (!user.isAuthenticated) return <Navigate to="/login" />;
  if (user.role !== allowedRole) return <Navigate to="/" />;
  return children;
};

export default ProtectedRoute;
