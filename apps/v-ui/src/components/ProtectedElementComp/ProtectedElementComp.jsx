import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";

export const ProtectedElementComp = ({ requiredPermission, element }) => {
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (location.pathname === '/callback') {
    return element;
  }
  return hasPermission(requiredPermission) ? element : <Navigate to="/access-denied" replace />;
};