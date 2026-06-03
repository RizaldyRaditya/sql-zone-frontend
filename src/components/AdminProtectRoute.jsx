import React from "react";
import { Navigate } from "react-router-dom";

const AdminProtectRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  const isAdmin = localStorage.getItem("isAdmin");

  if (!token || isAdmin !== "true") {
    return <Navigate to="/admin/login" replace />;
  }

  return element;
};

export default AdminProtectRoute;