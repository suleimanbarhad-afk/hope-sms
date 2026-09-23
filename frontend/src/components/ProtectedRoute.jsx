import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const homeForRole = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "lecturer") return "/lecturer/dashboard";
  return "/student/dashboard";
};

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return children;
}