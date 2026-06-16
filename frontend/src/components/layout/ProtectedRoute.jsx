import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

// Bảo vệ route: nếu chưa đăng nhập thì về /login
// Nếu không đúng role thì về /dashboard
export default function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
