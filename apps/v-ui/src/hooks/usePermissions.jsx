import React, { createContext, useContext, useMemo } from "react";


const PermissionsContext = createContext();

export const PermissionsProvider = ({ children, initialPermissions = [] }) => {
  let permissions = useMemo(() => initialPermissions, [initialPermissions]);
  if (!permissions || !Array.isArray(permissions) || permissions?.length === 0) {
    let storedPermissions = localStorage.getItem("userRoles");
    permissions = JSON.parse(storedPermissions || []);
  }

  const hasPermission = (requiredPermission) => {
    return permissions.includes(requiredPermission);
  };

  const value = useMemo(() => ({ permissions, hasPermission }), [permissions]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

//eslint-disable-next-line react-refresh/only-export-components
export const usePermissions = () => useContext(PermissionsContext);