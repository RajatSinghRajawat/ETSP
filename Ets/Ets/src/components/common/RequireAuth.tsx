import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { AuthRole } from '../../hooks/useAuth';
import { useAuth } from '../../hooks/useAuth';
import { buildLoginPath } from '../../utils/loginRedirect';

type Props = {
  children: React.ReactNode;
  /** When set, the signed-in user must hold this role to see the page. */
  role?: AuthRole;
};

/**
 * Gate for pages that only exist for a signed-in user.
 *
 * Signed out, the visitor goes straight to the login screen with this page
 * remembered as the return target — without waiting for an API call to come
 * back 401 first. Signed in as the wrong role, they go to their own dashboard
 * instead, since the page would only fail against the API anyway.
 */
const RequireAuth: React.FC<Props> = ({ children, role }) => {
  const { isLoggedIn, role: currentRole, dashboardPath } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={buildLoginPath(returnTo)} replace />;
  }

  if (role && currentRole !== role) {
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
