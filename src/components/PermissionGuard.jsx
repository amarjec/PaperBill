import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function PermissionGuard({ children, module, action }) {
  const { user } = useAuth();

  // 1. Owners automatically have access to everything
  if (user?.role === 'Owner') {
    return <>{children}</>;
  }

  // 2. If it's a Staff member, check their specific permission grid
  // We use optional chaining (?.) to prevent crashes if the permissions object is missing
  const hasPermission = user?.permissions?.[module]?.[action] === true;

  // 3. If they have permission, render the button/UI
  if (hasPermission) {
    return <>{children}</>;
  }

  // 4. If they DON'T have permission, render absolutely nothing
  return null;
}