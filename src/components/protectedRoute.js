import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    // If not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
